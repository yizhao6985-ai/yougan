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
