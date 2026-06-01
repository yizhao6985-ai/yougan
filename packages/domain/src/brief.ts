import { nanoid } from "nanoid";

/** 用户确认的单条创作需求 */
export interface BriefRequirement {
  id: string;
  description: string;
  confirmed_at: string;
}

/**
 * 创作 brief：灵感模式确认后的需求集合。
 * ready=true 表示 brief 已定稿，可进入创作模式。
 */
export interface WorkBrief {
  requirements: BriefRequirement[];
  ready: boolean;
}

export const EMPTY_WORK_BRIEF: WorkBrief = {
  requirements: [],
  ready: false,
};

export function newBriefRequirement(description: string): BriefRequirement {
  return {
    id: nanoid(12),
    description,
    confirmed_at: new Date().toISOString(),
  };
}
