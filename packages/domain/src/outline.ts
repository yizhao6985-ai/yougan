import { nanoid } from "nanoid";

/** 大纲单条（内容结构，非执行任务） */
export interface OutlineSection {
  id: string;
  description: string;
  confirmed_at: string;
}

/** 作品大纲：实时内容结构，对应 Work.outline（用户可见） */
export interface WorkOutline {
  sections: OutlineSection[];
  summary?: string | null;
}

export const EMPTY_WORK_OUTLINE: WorkOutline = {
  sections: [],
  summary: null,
};

export function getOutlineSummary(outline: WorkOutline): string | null {
  return outline.summary ?? null;
}

export function hasOutlineContent(outline: WorkOutline): boolean {
  return outline.sections.length > 0;
}

export function newOutlineSection(description: string): OutlineSection {
  return {
    id: nanoid(12),
    description,
    confirmed_at: new Date().toISOString(),
  };
}

export function findOutlineSectionIndex(
  outline: WorkOutline,
  sectionId: string,
): number {
  return outline.sections.findIndex((item) => item.id === sectionId);
}

/** 解析 outline JSON，剥离旧版 ready / 执行字段 */
export function parseOutlineJson(raw: unknown): WorkOutline {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_WORK_OUTLINE };
  }
  const value = raw as Record<string, unknown>;

  const legacyPending = value.pending_tasks as
    | Array<{ id: string; description: string; created_at?: string; confirmed_at?: string }>
    | undefined;

  const sectionsRaw = (value.sections ?? legacyPending) as
    | OutlineSection[]
    | undefined;

  const sections = (sectionsRaw ?? []).map((item) => ({
    id: item.id,
    description: item.description,
    confirmed_at:
      item.confirmed_at ??
      ("created_at" in item && item.created_at
        ? String(item.created_at)
        : new Date().toISOString()),
  }));

  return {
    sections,
    summary: (value.summary as string | null | undefined) ?? null,
  };
}
