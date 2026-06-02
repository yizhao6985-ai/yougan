import { mergeOutlineState } from "@yougan/domain";
import type { OutlineSection, WorkOutline } from "@/lib/types";
import { EMPTY_WORK_OUTLINE } from "@/lib/types";

export { mergeOutlineState };

export function updateOutlineSection(
  outline: WorkOutline | undefined,
  sectionId: string,
  description: string,
): WorkOutline {
  const base = outline ?? EMPTY_WORK_OUTLINE;
  const trimmed = description.trim();
  if (!trimmed) return base;

  const nextSections = base.sections.map((item) =>
    item.id === sectionId ? { ...item, description: trimmed } : item,
  );
  if (
    nextSections.every(
      (item, index) => item.description === base.sections[index]?.description,
    )
  ) {
    return base;
  }

  return {
    ...base,
    sections: nextSections,
  };
}

export function deleteOutlineSection(
  outline: WorkOutline | undefined,
  sectionId: string,
): WorkOutline {
  const base = outline ?? EMPTY_WORK_OUTLINE;
  const nextSections = base.sections.filter((item) => item.id !== sectionId);
  if (nextSections.length === base.sections.length) return base;

  return {
    ...base,
    sections: nextSections,
  };
}

export function clearOutline(_outline: WorkOutline | undefined): WorkOutline {
  return { ...EMPTY_WORK_OUTLINE };
}

export function mergeOutlineForDisplay(
  cached?: WorkOutline,
  streamed?: WorkOutline,
): WorkOutline | undefined {
  if (!cached && !streamed) return undefined;
  if (!cached) return streamed;
  if (!streamed) return cached;
  return mergeOutlineState(cached, streamed);
}

export type { OutlineSection };
