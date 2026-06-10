/** 制作团队部门（内部编排，不对用户展示部门名） */
export type ProductionDepartment = "writing" | "design" | "audio" | "video";

export const PRODUCTION_DEPARTMENTS: ProductionDepartment[] = [
  "writing",
  "design",
  "audio",
  "video",
];

/** 待执行任务（schedule-production 入队） */
export interface ProductionPlanTask {
  id: string;
  description: string;
  created_at: string;
  department?: ProductionDepartment;
  status?: "pending" | "in_progress" | "completed";
  assignee?: string | null;
}

/** 已落地任务批次（inspect / commit 后归档） */
export interface ExecutedPlanTask {
  id: string;
  description: string;
  executed_at: string;
  batch_summary?: string | null;
  department?: ProductionDepartment;
  assignee?: string | null;
}

/**
 * 制作统筹计划（Work.productionPlan）。
 * 用户不可见；驱动 production 子图多部门流水线。
 */
export interface WorkProductionPlan {
  pending_tasks: ProductionPlanTask[];
  executed_tasks: ExecutedPlanTask[];
  last_execution_summary?: string | null;
  summary?: string | null;
  departments?: ProductionDepartment[];
  industry_context?: string | null;
  director_notes?: string | null;
}

export const EMPTY_WORK_PRODUCTION_PLAN: WorkProductionPlan = {
  pending_tasks: [],
  executed_tasks: [],
  last_execution_summary: null,
  summary: null,
  departments: [],
  industry_context: null,
  director_notes: null,
};
