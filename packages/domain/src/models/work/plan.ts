/** 制作团队部门 */
export type ProductionDepartment = "writing" | "design" | "audio" | "video";

export const PRODUCTION_DEPARTMENTS: ProductionDepartment[] = [
  "writing",
  "design",
  "audio",
  "video",
];

/** 创作计划任务（内部，不对用户展示） */
export interface ProductionPlanTask {
  id: string;
  description: string;
  created_at: string;
  department?: ProductionDepartment;
  status?: "pending" | "in_progress" | "completed";
  assignee?: string | null;
}

/** 已在作品中落地的任务批次（内部） */
export interface ExecutedPlanTask {
  id: string;
  description: string;
  executed_at: string;
  batch_summary?: string | null;
  department?: ProductionDepartment;
  assignee?: string | null;
}

/** 创意总监创作计划，对应 Work.plan（内部物化，用户不可见） */
export interface WorkProductionPlan {
  pending_tasks: ProductionPlanTask[];
  executed_tasks: ExecutedPlanTask[];
  last_execution_summary?: string | null;
  ready: boolean;
  summary?: string | null;
  departments?: ProductionDepartment[];
  industry_context?: string | null;
  director_notes?: string | null;
}

export const EMPTY_WORK_PRODUCTION_PLAN: WorkProductionPlan = {
  pending_tasks: [],
  executed_tasks: [],
  last_execution_summary: null,
  ready: false,
  summary: null,
  departments: [],
  industry_context: null,
  director_notes: null,
};
