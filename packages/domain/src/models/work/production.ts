import type { WorkPreview } from "./preview.js";

// —— 部门 ——

/** 制作团队部门（内部编排，不对用户展示部门名） */
export type ProductionDepartment = "writing" | "design" | "audio" | "video";

export const PRODUCTION_DEPARTMENTS: ProductionDepartment[] = [
  "writing",
  "design",
  "audio",
  "video",
];

// —— 任务状态 ——

/**
 * 待执行任务的生命周期。
 * pending → in_progress（当前执行）→ ready；失败则 failed；备妥后由 assemblePreview 整合并清空。
 */
export type ProductionTaskStatus =
  | "pending"
  | "in_progress"
  | "ready"
  | "failed";

// —— 交付物 ——

/** 单任务产出片段（验收前草稿；commit 时剥离） */
export interface ProductionTaskDeliverable {
  body: string;
  title?: string | null;
  notes?: string | null;
}

/** assemblePreview 等按 taskId 索引片段时使用 */
export interface TaskDeliverable extends ProductionTaskDeliverable {
  taskId: string;
}

// —— 任务 ——

/** planProduction 入队的单条制作任务 */
export interface ProductionTask {
  // 标识
  /** 任务唯一 id（nanoid） */
  id: string;
  /** ISO 8601 创建时间 */
  created_at: string;

  // 计划
  /** 任务描述：做什么、产出什么 */
  description: string;
  /** 负责部门；缺省由执行节点按管线推断 */
  department?: ProductionDepartment;
  /** 总监基于 profile 给出的产出方向指导（传给执行 LLM 与验收员） */
  direction?: string | null;
  /** 方向性验收标准：验收员对照 profile 与计划判断是否达标 */
  acceptance_criteria?: string | null;

  // 执行与验收（staging 字段在 commit 时剥离）
  /** 执行与验收进度；缺省视为 pending */
  status?: ProductionTaskStatus;
  /** 本轮执行产出 */
  deliverable?: ProductionTaskDeliverable | null;
  /** 最近一次验收未通过时的修改建议；通过或重试产出时清空 */
  feedback?: string | null;
  /** 验收重试次数 */
  accept_retry_count?: number;
  /** 终局失败说明 */
  failure_message?: string | null;
}

// —— 制作聚合 ——

/**
 * 制作环节聚合（Work.production / turn.staging.production）。
 * task 上的执行字段为 staging 草稿；落库时剥离。
 */
export interface WorkProduction {
  pending_tasks: ProductionTask[];
  /** 用户对本轮制作的要求（开写/改稿意图）；进 plan 前写入，plan 环节不覆盖 */
  summary?: string | null;
  preview: WorkPreview | null;
}

export const EMPTY_WORK_PRODUCTION: WorkProduction = {
  pending_tasks: [],
  summary: null,
  preview: null,
};

// —— 落库归一化 ——

/** 落库用：去掉 task 上的 staging 执行字段 */
export function committedProductionTask(task: ProductionTask): ProductionTask {
  return {
    id: task.id,
    created_at: task.created_at,
    description: task.description,
    department: task.department,
    direction: task.direction,
    acceptance_criteria: task.acceptance_criteria,
    status: task.status,
    feedback: task.feedback,
  };
}

/** 去掉 task 执行草稿，得到可落库的 WorkProduction */
export function committedProduction(
  production: WorkProduction,
): WorkProduction {
  return {
    pending_tasks: (production.pending_tasks ?? []).map(
      committedProductionTask,
    ),
    summary: production.summary ?? null,
    preview: production.preview ?? null,
  };
}
