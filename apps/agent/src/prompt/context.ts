/**
 * 把 profile / outline / plan / brief 转成短文本，嵌入各 agent 的系统提示词。
 */
import type {
  WorkBrief,
  WorkOutline,
  WorkProductionPlan,
  WorkProfile,
} from "@yougan/domain";
import { getOutlineSummary, getPlanSummary, isPlanReady } from "@yougan/domain";
import { contentSpecSummary as buildContentSpecSummary } from "../lib/content-spec.js";

export function contentSpecSummary(profile: WorkProfile): string {
  return buildContentSpecSummary(profile);
}

export function profileSummary(profile: WorkProfile): string {
  const parts: string[] = [];
  if (profile.platform) parts.push(`平台：${profile.platform}`);
  if (profile.content_topic) parts.push(`主题：${profile.content_topic}`);
  if (profile.content_type) parts.push(`类型：${profile.content_type}`);
  parts.push(contentSpecSummary(profile));
  if (profile.content_points?.length)
    parts.push(`要点：${profile.content_points.join(", ")}`);
  if (profile.style) parts.push(`风格：${profile.style}`);
  if (profile.tone) parts.push(`语气：${profile.tone}`);
  if (profile.persona) parts.push(`人设：${profile.persona}`);
  if (profile.audience) parts.push(`受众：${profile.audience}`);
  if (profile.goals?.length) parts.push(`目标：${profile.goals.join(", ")}`);
  if (profile.style_constraints?.length)
    parts.push(`约束：${profile.style_constraints.join(", ")}`);
  if (profile.notes) parts.push(`备注：${profile.notes}`);
  parts.push(`参考素材：${profile.references?.length ?? 0} 条`);
  return parts.length ? parts.join("；") : "尚无已执行特征";
}

export function outlineSummary(outline: WorkOutline): string {
  if (!outline.sections.length && !getOutlineSummary(outline)) {
    return "尚无内容大纲";
  }
  const lines: string[] = [`内容大纲（${outline.sections.length} 条）`];
  if (getOutlineSummary(outline)) {
    lines.push(`摘要：${getOutlineSummary(outline)}`);
  }
  if (outline.sections.length) {
    lines.push(
      `条目：${outline.sections.map((s) => s.description).join("；")}`,
    );
  }
  return lines.join("\n");
}

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

export function briefSummary(brief: WorkBrief): string {
  if (!brief.requirements.length) return "尚无 brief 需求";
  return `Brief 需求（${brief.requirements.length} 条）：${brief.requirements.map((r) => r.description).join("；")}`;
}

export function profileContext(profile: WorkProfile): string {
  const parts: string[] = [];
  if (profile.platform) parts.push(`平台：${profile.platform}`);
  if (profile.content_topic) parts.push(`主题：${profile.content_topic}`);
  if (profile.content_type) parts.push(`类型：${profile.content_type}`);
  if (profile.audience) parts.push(`受众：${profile.audience}`);
  if (profile.style) parts.push(`风格：${profile.style}`);
  if (profile.tone) parts.push(`语气：${profile.tone}`);
  if (profile.goals?.length) parts.push(`目标：${profile.goals.join("、")}`);
  return parts.length ? parts.join("；") : "暂无";
}
