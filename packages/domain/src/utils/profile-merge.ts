import { EMPTY_WORK_PROFILE, type WorkProfile } from "../models/work/profile.js";
import { isProfileEmpty, parseProfileJson } from "./work/profile.js";

function isProfileAuthoritativeReplace(base: WorkProfile, next: WorkProfile): boolean {
  if (next.blueprint.segments.length < base.blueprint.segments.length) return true;
  if (next.blueprint.settings.length < base.blueprint.settings.length) return true;
  if (next.guardrails.length < base.guardrails.length) return true;

  const baseSegmentIds = new Set(base.blueprint.segments.map((s) => s.id));
  for (const id of baseSegmentIds) {
    if (!next.blueprint.segments.some((s) => s.id === id)) return true;
  }

  const baseSettingIds = new Set(base.blueprint.settings.map((s) => s.id));
  for (const id of baseSettingIds) {
    if (!next.blueprint.settings.some((s) => s.id === id)) return true;
  }

  const baseGuardrailIds = new Set(base.guardrails.map((g) => g.id));
  for (const id of baseGuardrailIds) {
    if (!next.guardrails.some((g) => g.id === id)) return true;
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
    delivery: { ...base.delivery, ...patch.delivery },
    expression: {
      audience: patch.expression.audience ?? base.expression.audience,
      verbal: { ...base.expression.verbal, ...patch.expression.verbal },
      visual: { ...base.expression.visual, ...patch.expression.visual },
    },
    blueprint: {
      summary: patch.blueprint.summary.trim() || base.blueprint.summary,
      settings: patch.blueprint.settings.length
        ? patch.blueprint.settings
        : base.blueprint.settings,
      segments: patch.blueprint.segments.length
        ? patch.blueprint.segments
        : base.blueprint.segments,
    },
    guardrails: patch.guardrails.length ? patch.guardrails : base.guardrails,
    params: patch.params.kind !== base.params.kind ? patch.params : patch.params,
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
