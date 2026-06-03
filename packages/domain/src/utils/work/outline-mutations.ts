import {
  EMPTY_WORK_OUTLINE,
  type OutlineSection,
  type WorkOutline,
} from "../../models/work/outline.js";
import { newOutlineSection } from "./outline.js";

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

  return { ...base, sections: nextSections };
}

export function deleteOutlineSection(
  outline: WorkOutline | undefined,
  sectionId: string,
): WorkOutline {
  const base = outline ?? EMPTY_WORK_OUTLINE;
  const nextSections = base.sections.filter((item) => item.id !== sectionId);
  if (nextSections.length === base.sections.length) return base;

  return { ...base, sections: nextSections };
}

export function clearOutline(_outline: WorkOutline | undefined): WorkOutline {
  return { ...EMPTY_WORK_OUTLINE };
}

/** 追加一条大纲；描述为空或重复时返回 null */
export function appendOutlineSection(
  outline: WorkOutline,
  description: string,
): WorkOutline | null {
  const trimmed = description.trim();
  if (!trimmed) return null;
  if (outline.sections.some((item) => item.description.trim() === trimmed)) {
    return null;
  }
  return {
    ...outline,
    sections: [...outline.sections, newOutlineSection(trimmed)],
  };
}

export type { OutlineSection };
