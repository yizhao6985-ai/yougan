import type { ConfirmedRequirement, WorkInspiration } from "@/lib/types";
import { EMPTY_WORK_INSPIRATION } from "@/lib/types";

export { EMPTY_WORK_INSPIRATION };

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

export function updateInspirationRequirement(
  inspiration: WorkInspiration | undefined,
  requirementId: string,
  description: string,
): WorkInspiration {
  const base = inspiration ?? EMPTY_WORK_INSPIRATION;
  const trimmed = description.trim();
  if (!trimmed) return base;

  const nextRequirements = base.confirmed_requirements.map((item) =>
    item.id === requirementId ? { ...item, description: trimmed } : item,
  );
  if (
    nextRequirements.every(
      (item, index) =>
        item.description === base.confirmed_requirements[index]?.description,
    )
  ) {
    return base;
  }

  return {
    ...base,
    confirmed_requirements: nextRequirements,
  };
}

export function deleteInspirationRequirement(
  inspiration: WorkInspiration | undefined,
  requirementId: string,
): WorkInspiration {
  const base = inspiration ?? EMPTY_WORK_INSPIRATION;
  const nextRequirements = base.confirmed_requirements.filter(
    (item) => item.id !== requirementId,
  );
  if (nextRequirements.length === base.confirmed_requirements.length) return base;

  return {
    ...base,
    confirmed_requirements: nextRequirements,
  };
}

export function clearInspirations(
  _inspiration: WorkInspiration | undefined,
): WorkInspiration {
  return { ...EMPTY_WORK_INSPIRATION };
}

/** 合并缓存与流式 inspiration，保留乐观更新并去重 */
export function mergeInspirationState(
  cached?: WorkInspiration,
  streamed?: WorkInspiration,
): WorkInspiration | undefined {
  if (!cached && !streamed) return undefined;

  const base = cached ?? EMPTY_WORK_INSPIRATION;
  if (!streamed) return base;
  if (isInspirationEmpty(streamed) && !isInspirationEmpty(base)) {
    return base;
  }

  const confirmed = dedupeConfirmedRequirements([
    ...base.confirmed_requirements,
    ...(streamed.confirmed_requirements ?? []),
  ]);

  return {
    ...base,
    ...streamed,
    confirmed_requirements: confirmed,
  };
}
