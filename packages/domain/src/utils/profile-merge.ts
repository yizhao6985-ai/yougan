import { EMPTY_WORK_PROFILE, type WorkProfile } from "../models/work/profile.js";
import { isProfileEmpty, normalizeProfileTextField, parseProfileJson } from "./work/profile.js";

function isProfileAuthoritativeReplace(base: WorkProfile, next: WorkProfile): boolean {
  if (next.setting.length < base.setting.length) return true;
  if (next.requirements.length < base.requirements.length) return true;
  if (next.bounds.length < base.bounds.length) return true;

  for (const id of base.setting.map((item) => item.id)) {
    if (!next.setting.some((item) => item.id === id)) return true;
  }
  for (const id of base.requirements.map((item) => item.id)) {
    if (!next.requirements.some((item) => item.id === id)) return true;
  }
  for (const id of base.bounds.map((item) => item.id)) {
    if (!next.bounds.some((item) => item.id === id)) return true;
  }

  return false;
}

/** 合并 profile 更新，避免空对象覆盖已有内容 */
export function mergeProfileState(
  prev: WorkProfile | undefined,
  next: WorkProfile,
): WorkProfile {
  const base = parseProfileJson(prev ?? EMPTY_WORK_PROFILE);
  const patch = parseProfileJson(next);
  if (isProfileEmpty(patch) && !isProfileEmpty(base)) {
    return base;
  }

  if (isProfileAuthoritativeReplace(base, patch)) {
    return patch;
  }

  return {
    direction: {
      summary: patch.direction.summary.trim() || base.direction.summary,
      format: patch.direction.format ?? base.direction.format,
      audience: patch.direction.audience ?? base.direction.audience,
    },
    style: {
      verbal:
        patch.style?.verbal !== undefined
          ? normalizeProfileTextField(patch.style.verbal)
          : base.style?.verbal,
      visual:
        patch.style?.visual !== undefined
          ? normalizeProfileTextField(patch.style.visual)
          : base.style?.visual,
    },
    setting: patch.setting.length ? patch.setting : base.setting,
    requirements: patch.requirements.length ? patch.requirements : base.requirements,
    bounds: patch.bounds.length ? patch.bounds : base.bounds,
  };
}

export function mergeProfileForDisplay(
  cached?: WorkProfile | unknown,
  streamed?: WorkProfile | unknown,
): WorkProfile | undefined {
  const normalizedCached = cached != null ? parseProfileJson(cached) : undefined;
  const normalizedStreamed =
    streamed != null ? parseProfileJson(streamed) : undefined;
  if (!normalizedCached && !normalizedStreamed) return undefined;
  if (!normalizedCached) return normalizedStreamed;
  if (!normalizedStreamed) return normalizedCached;
  return mergeProfileState(normalizedCached, normalizedStreamed);
}
