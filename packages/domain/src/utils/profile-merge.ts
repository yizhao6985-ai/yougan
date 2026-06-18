import { EMPTY_WORK_PROFILE, type WorkProfile } from "../models/work/profile.js";
import { isProfileEmpty, parseProfileJson } from "./work/profile.js";

function isProfileAuthoritativeReplace(base: WorkProfile, next: WorkProfile): boolean {
  if (next.context.length < base.context.length) return true;
  if (next.sequence.length < base.sequence.length) return true;
  if (next.bounds.length < base.bounds.length) return true;

  for (const id of base.context.map((item) => item.id)) {
    if (!next.context.some((item) => item.id === id)) return true;
  }
  for (const id of base.sequence.map((item) => item.id)) {
    if (!next.sequence.some((item) => item.id === id)) return true;
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
          ? patch.style.verbal
          : base.style?.verbal,
      visual:
        patch.style?.visual !== undefined
          ? patch.style.visual
          : base.style?.visual,
    },
    context: patch.context.length ? patch.context : base.context,
    sequence: patch.sequence.length ? patch.sequence : base.sequence,
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
