import { EMPTY_WORK_BRIEF, type BriefRequirement, type WorkBrief } from "./brief.js";

export function dedupeBriefRequirements(
  items: BriefRequirement[],
): BriefRequirement[] {
  const seen = new Set<string>();
  const result: BriefRequirement[] = [];

  for (const item of items) {
    const key = item.description.trim().replace(/\s+/g, " ");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

export function isBriefEmpty(brief: WorkBrief | undefined): boolean {
  if (!brief) return true;
  return brief.requirements.length === 0;
}

export function findBriefRequirementIndex(
  brief: WorkBrief,
  requirementId: string,
): number {
  return brief.requirements.findIndex((item) => item.id === requirementId);
}

function isBriefAuthoritativeReplace(
  base: WorkBrief,
  next: WorkBrief,
): boolean {
  const baseIds = new Set(base.requirements.map((r) => r.id));
  const nextIds = new Set(next.requirements.map((r) => r.id));

  if (next.requirements.length < base.requirements.length) return true;
  for (const id of baseIds) {
    if (!nextIds.has(id)) return true;
  }
  for (const item of next.requirements) {
    const prev = base.requirements.find((r) => r.id === item.id);
    if (prev && prev.description !== item.description) return true;
  }
  return false;
}

/** 合并 brief 更新，避免空对象覆盖已有内容 */
export function mergeBriefState(
  prev: WorkBrief | undefined,
  next: WorkBrief,
): WorkBrief {
  const base = prev ?? EMPTY_WORK_BRIEF;
  if (isBriefEmpty(next) && !isBriefEmpty(base)) {
    return base;
  }

  if (isBriefAuthoritativeReplace(base, next)) {
    return { requirements: dedupeBriefRequirements(next.requirements) };
  }

  const requirements = dedupeBriefRequirements([
    ...base.requirements,
    ...next.requirements,
  ]);

  return { requirements };
}
