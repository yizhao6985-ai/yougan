import {
  EMPTY_WORK_OUTLINE,
  type OutlineSection,
  type WorkOutline,
} from "./outline.js";

export function dedupeOutlineSections(
  items: OutlineSection[],
): OutlineSection[] {
  const seen = new Set<string>();
  const result: OutlineSection[] = [];

  for (const item of items) {
    const key = item.description.trim().replace(/\s+/g, " ");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

export function isOutlineEmpty(outline: WorkOutline | undefined): boolean {
  if (!outline) return true;
  return outline.sections.length === 0;
}

export function mergeOutlineState(
  prev: WorkOutline | undefined,
  next: WorkOutline,
): WorkOutline {
  const base = prev ?? EMPTY_WORK_OUTLINE;
  if (isOutlineEmpty(next) && !isOutlineEmpty(base)) {
    return base;
  }

  return {
    ...base,
    ...next,
    sections: next.sections ?? base.sections,
  };
}
