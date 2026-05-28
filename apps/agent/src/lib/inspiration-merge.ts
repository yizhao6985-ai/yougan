/**
 * 灵感 state 合并与 CRUD 辅助。
 *
 * mergeInspirationState 用于 state.ts reducer 与前端 syncFromStream，
 * 核心规则：空更新不覆盖已有灵感。
 */
import {
  EMPTY_WORK_INSPIRATION,
  type ConfirmedRequirement,
  type WorkInspiration,
} from "../schemas.js";

export function dedupeConfirmedRequirements(
  items: ConfirmedRequirement[],
): ConfirmedRequirement[] {
  const seen = new Set<string>();
  const result: ConfirmedRequirement[] = [];

  for (const item of items) {
    const key = item.description.trim().replace(/\s+/g, " ");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

export function isInspirationEmpty(
  inspiration: WorkInspiration | undefined,
): boolean {
  if (!inspiration) return true;
  return inspiration.confirmed_requirements.length === 0;
}

export function findRequirementIndex(
  inspiration: WorkInspiration,
  requirementId: string,
): number {
  return inspiration.confirmed_requirements.findIndex(
    (item) => item.id === requirementId,
  );
}

/** 合并已有灵感与本次更新，避免大纲/创作流程用空对象覆盖已定稿灵感。 */
export function mergeInspirationState(
  prev: WorkInspiration | undefined,
  next: WorkInspiration,
): WorkInspiration {
  const base = prev ?? EMPTY_WORK_INSPIRATION;
  if (isInspirationEmpty(next) && !isInspirationEmpty(base)) {
    return base;
  }

  const confirmed = dedupeConfirmedRequirements([
    ...base.confirmed_requirements,
    ...next.confirmed_requirements,
  ]);

  return {
    ...base,
    ...next,
    confirmed_requirements: confirmed,
  };
}
