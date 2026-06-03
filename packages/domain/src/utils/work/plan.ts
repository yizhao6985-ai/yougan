import { nanoid } from "nanoid";
import {
  EMPTY_WORK_PRODUCTION_PLAN,
  type ProductionDepartment,
  type ProductionPlanTask,
  type WorkProductionPlan,
} from "../../models/work/plan.js";

export function isPlanReady(plan: WorkProductionPlan): boolean {
  return plan.ready;
}

export function getPlanSummary(plan: WorkProductionPlan): string | null {
  return plan.summary ?? null;
}

export function newProductionPlanTask(
  description: string,
  department?: ProductionDepartment,
): ProductionPlanTask {
  return {
    id: nanoid(12),
    description,
    created_at: new Date().toISOString(),
    department,
    status: "pending",
  };
}

/** 解析 plan JSON */
export function parsePlanJson(raw: unknown): WorkProductionPlan {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_WORK_PRODUCTION_PLAN };
  }
  const value = raw as WorkProductionPlan;
  return {
    pending_tasks: value.pending_tasks ?? [],
    executed_tasks: value.executed_tasks ?? [],
    last_execution_summary: value.last_execution_summary ?? null,
    ready: value.ready ?? false,
    summary: value.summary ?? null,
    departments: value.departments ?? [],
    industry_context: value.industry_context ?? null,
    director_notes: value.director_notes ?? null,
  };
}
