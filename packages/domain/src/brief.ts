import { nanoid } from "nanoid";

/** 用户确认的单条创作需求 */
export interface BriefRequirement {
  id: string;
  description: string;
  confirmed_at: string;
}

/** 创作 brief：灵感模式确认的实时需求集合 */
export interface WorkBrief {
  requirements: BriefRequirement[];
}

export const EMPTY_WORK_BRIEF: WorkBrief = {
  requirements: [],
};

export function newBriefRequirement(description: string): BriefRequirement {
  return {
    id: nanoid(12),
    description,
    confirmed_at: new Date().toISOString(),
  };
}

export function hasBriefContent(brief: WorkBrief): boolean {
  return brief.requirements.length > 0;
}

/** 解析 brief JSON，忽略旧版 ready 字段 */
export function parseBriefJson(raw: unknown): WorkBrief {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_WORK_BRIEF };
  }
  const value = raw as WorkBrief;
  return { requirements: value.requirements ?? [] };
}
