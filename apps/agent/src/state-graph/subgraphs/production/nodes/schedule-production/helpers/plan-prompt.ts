import {
  getPlanSummary,
  isPlanReady,
  type WorkProductionPlan,
} from "@yougan/domain";

/** 内部创作计划摘要（LLM prompt 用） */
export function productionPlanSummary(plan: WorkProductionPlan): string {
  if (
    !plan.pending_tasks.length &&
    !plan.executed_tasks.length &&
    !getPlanSummary(plan)
  ) {
    return "尚无内部创作计划";
  }
  const lines: string[] = [];
  if (isPlanReady(plan) && getPlanSummary(plan)) {
    lines.push(`创作计划：已定稿`);
    lines.push(`计划摘要：${getPlanSummary(plan)}`);
  } else if (plan.pending_tasks.length) {
    lines.push(`创作计划：拟定中（${plan.pending_tasks.length} 项任务）`);
  }
  if (plan.departments?.length) {
    lines.push(`制作部门：${plan.departments.join("、")}`);
  }
  if (plan.industry_context) {
    lines.push(`行业背景：${plan.industry_context}`);
  }
  if (plan.director_notes) {
    lines.push(`创意总监备注：${plan.director_notes}`);
  }
  if (plan.pending_tasks.length) {
    lines.push(
      `待执行任务：${plan.pending_tasks.map((c) => `${c.department ? `[${c.department}]` : ""}${c.description}`).join("；")}`,
    );
  }
  if (plan.executed_tasks.length) {
    const recent = plan.executed_tasks.slice(-5);
    lines.push(
      `已完成（最近 ${recent.length} 项）：${recent.map((c) => c.description).join("；")}`,
    );
  }
  if (plan.last_execution_summary) {
    lines.push(`上次执行摘要：${plan.last_execution_summary}`);
  }
  return lines.join("\n");
}
