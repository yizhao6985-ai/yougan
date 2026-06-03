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
