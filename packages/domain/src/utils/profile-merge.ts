import { EMPTY_WORK_PROFILE, type WorkProfile } from "../models/work/profile.js";
import { isProfileEmpty, parseProfileJson } from "./work/profile.js";

function isProfileAuthoritativeReplace(base: WorkProfile, next: WorkProfile): boolean {
  if (next.beats.length < base.beats.length) return true;
  if (next.constraints.length < base.constraints.length) return true;
  if (next.references.length < base.references.length) return true;

  const baseBeatIds = new Set(base.beats.map((b) => b.id));
  for (const id of baseBeatIds) {
    if (!next.beats.some((b) => b.id === id)) return true;
  }

  const baseConstraintIds = new Set(base.constraints.map((c) => c.id));
  for (const id of baseConstraintIds) {
    if (!next.constraints.some((c) => c.id === id)) return true;
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
    spec: { ...base.spec, ...patch.spec },
    voice: { ...base.voice, ...patch.voice },
    premise: patch.premise.trim() || base.premise,
    references: patch.references.length ? patch.references : base.references,
    constraints: patch.constraints.length ? patch.constraints : base.constraints,
    beats: patch.beats.length ? patch.beats : base.beats,
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
