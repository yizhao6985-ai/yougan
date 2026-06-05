import {
  EMPTY_WORK_BLUEPRINT,
  type WorkBlueprint,
} from "../models/work/blueprint.js";
import { isBlueprintEmpty } from "./work/blueprint.js";

function isBlueprintAuthoritativeReplace(
  base: WorkBlueprint,
  next: WorkBlueprint,
): boolean {
  if (next.beats.length < base.beats.length) return true;
  if (next.constraints.length < base.constraints.length) return true;

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

/** 合并 blueprint 更新，避免空对象覆盖已有内容 */
export function mergeBlueprintState(
  prev: WorkBlueprint | undefined,
  next: WorkBlueprint,
): WorkBlueprint {
  const base = prev ?? EMPTY_WORK_BLUEPRINT;
  if (isBlueprintEmpty(next) && !isBlueprintEmpty(base)) {
    return base;
  }

  if (isBlueprintAuthoritativeReplace(base, next)) {
    return next;
  }

  return {
    spec: { ...base.spec, ...next.spec },
    voice: { ...base.voice, ...next.voice },
    premise: next.premise.trim() || base.premise,
    constraints: next.constraints.length ? next.constraints : base.constraints,
    beats: next.beats.length ? next.beats : base.beats,
  };
}

export function mergeBlueprintForDisplay(
  cached?: WorkBlueprint,
  streamed?: WorkBlueprint,
): WorkBlueprint | undefined {
  if (!cached && !streamed) return undefined;
  if (!cached) return streamed;
  if (!streamed) return cached;
  return mergeBlueprintState(cached, streamed);
}
