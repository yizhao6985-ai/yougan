import { nanoid } from "nanoid";
import {
  EMPTY_WORK_BRIEF,
  type BriefRequirement,
  type WorkBrief,
} from "../../models/work/brief.js";

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
