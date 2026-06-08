import {
  EMPTY_WORK_REFERENCES,
  type WorkReference,
} from "../models/work/reference.js";
import { parseReferencesJson } from "./work/reference.js";

function isReferencesAuthoritativeReplace(
  base: WorkReference[],
  next: WorkReference[],
): boolean {
  if (next.length < base.length) return true;

  const baseIds = new Set(base.map((item) => item.id));
  for (const id of baseIds) {
    if (!next.some((item) => item.id === id)) return true;
  }

  return false;
}

/** 合并 references 更新，避免空数组覆盖已有内容 */
export function mergeReferencesState(
  prev: WorkReference[] | undefined,
  next: WorkReference[] | undefined,
): WorkReference[] {
  const base = parseReferencesJson(prev ?? EMPTY_WORK_REFERENCES);
  const patch = parseReferencesJson(next ?? EMPTY_WORK_REFERENCES);

  if (!patch.length) return base;
  if (!base.length) return patch;
  if (isReferencesAuthoritativeReplace(base, patch)) return patch;
  return patch;
}

export function mergeReferencesForDisplay(
  cached?: WorkReference[] | unknown,
  streamed?: WorkReference[] | unknown,
): WorkReference[] {
  const normalizedCached =
    cached != null ? parseReferencesJson(cached) : undefined;
  const normalizedStreamed =
    streamed != null ? parseReferencesJson(streamed) : undefined;
  if (!normalizedCached?.length && !normalizedStreamed?.length) {
    return [...EMPTY_WORK_REFERENCES];
  }
  if (!normalizedCached?.length) return normalizedStreamed ?? [...EMPTY_WORK_REFERENCES];
  if (!normalizedStreamed?.length) return normalizedCached;
  return mergeReferencesState(normalizedCached, normalizedStreamed);
}
