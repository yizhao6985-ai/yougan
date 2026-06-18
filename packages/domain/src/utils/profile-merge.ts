import { EMPTY_WORK_PROFILE, type WorkProfile } from "../models/work/profile.js";
import { mergeDeliveryMediaParams } from "./work/delivery-media-params.js";
import { isProfileEmpty, parseProfileJson } from "./work/profile.js";

function isProfileAuthoritativeReplace(base: WorkProfile, next: WorkProfile): boolean {
  if (next.structure.segments.length < base.structure.segments.length) return true;
  if (next.structure.settings.length < base.structure.settings.length) return true;
  if (next.constraints.rules.length < base.constraints.rules.length) return true;

  const baseSegmentIds = new Set(base.structure.segments.map((s) => s.id));
  for (const id of baseSegmentIds) {
    if (!next.structure.segments.some((s) => s.id === id)) return true;
  }

  const baseSettingIds = new Set(base.structure.settings.map((s) => s.id));
  for (const id of baseSettingIds) {
    if (!next.structure.settings.some((s) => s.id === id)) return true;
  }

  const baseRuleIds = new Set(base.constraints.rules.map((g) => g.id));
  for (const id of baseRuleIds) {
    if (!next.constraints.rules.some((g) => g.id === id)) return true;
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
    intent: {
      summary: patch.intent.summary.trim() || base.intent.summary,
    },
    delivery: {
      ...base.delivery,
      ...patch.delivery,
      media_params: mergeDeliveryMediaParams(
        base.delivery.media_params,
        patch.delivery.media_params,
      ),
    },
    expression: {
      audience: patch.expression.audience ?? base.expression.audience,
      verbal:
        patch.expression.verbal !== undefined
          ? patch.expression.verbal
          : base.expression.verbal,
      visual:
        patch.expression.visual !== undefined
          ? patch.expression.visual
          : base.expression.visual,
    },
    structure: {
      settings: patch.structure.settings.length
        ? patch.structure.settings
        : base.structure.settings,
      segments: patch.structure.segments.length
        ? patch.structure.segments
        : base.structure.segments,
    },
    constraints: {
      rules: patch.constraints.rules.length
        ? patch.constraints.rules
        : base.constraints.rules,
    },
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
