import type { WorkBlueprint } from "../models/work/blueprint.js";
import type { WorkProductionPlan } from "../models/work/plan.js";
import type { WorkProfile } from "../models/work/profile.js";
import { getBlueprintPremise } from "./work/blueprint.js";
import { getPlanSummary, isPlanReady } from "./work/plan.js";
import {
  contentFormatLabel,
  contentSpecSummary,
  mediaModalityLabel,
} from "./content-spec.js";

export function referencesSummary(profile: WorkProfile): string {
  const count = profile.references?.length ?? 0;
  return count ? `参考素材：${count} 条` : "尚无参考素材";
}

export function blueprintSpecSummary(blueprint: WorkBlueprint): string {
  const { spec } = blueprint;
  const parts = [
    spec.content_topic ? `主题：${spec.content_topic}` : null,
    spec.content_type ? `类型：${spec.content_type}` : null,
    spec.content_format
      ? `体裁：${contentFormatLabel(spec.content_format) ?? spec.content_format}`
      : null,
    spec.media_modality
      ? `形式：${mediaModalityLabel(spec.media_modality) ?? spec.media_modality}`
      : null,
  ].filter(Boolean);
  return parts.length ? parts.join("；") : "尚未确定创作规格";
}

export function blueprintVoiceSummary(blueprint: WorkBlueprint): string {
  const { voice } = blueprint;
  const parts = [
    voice.audience ? `受众：${voice.audience}` : null,
    voice.tone ? `语气：${voice.tone}` : null,
    voice.style ? `风格：${voice.style}` : null,
    voice.persona ? `人设：${voice.persona}` : null,
    voice.goals?.length ? `目标：${voice.goals.join("、")}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join("；") : "尚未确定表达设定";
}

export function blueprintSummary(blueprint: WorkBlueprint): string {
  const premise = getBlueprintPremise(blueprint);
  const lines: string[] = ["作品方案"];
  if (premise) lines.push(`定位：${premise}`);
  lines.push(blueprintSpecSummary(blueprint));
  lines.push(blueprintVoiceSummary(blueprint));
  if (blueprint.constraints.length) {
    lines.push(
      `要求（${blueprint.constraints.length} 条）：${blueprint.constraints.map((c) => c.description).join("；")}`,
    );
  }
  if (blueprint.beats.length) {
    lines.push(
      `结构（${blueprint.beats.length} 节）：${blueprint.beats.map((b, i) => `${i + 1}. ${b.description}`).join("；")}`,
    );
  }
  if (
    !premise &&
    !blueprint.constraints.length &&
    !blueprint.beats.length &&
    !blueprint.spec.content_topic
  ) {
    return "尚无作品方案";
  }
  return lines.join("\n");
}

/** @deprecated 使用 blueprintSummary */
export function outlineSummary(blueprint: WorkBlueprint): string {
  return blueprintSummary(blueprint);
}

/** @deprecated 使用 blueprintSummary */
export function briefSummary(blueprint: WorkBlueprint): string {
  if (!blueprint.constraints.length && !blueprint.premise.trim()) {
    return "尚无作品方案";
  }
  const parts = [];
  if (blueprint.premise.trim()) parts.push(blueprint.premise.trim());
  if (blueprint.constraints.length) {
    parts.push(blueprint.constraints.map((c) => c.description).join("；"));
  }
  return `作品方案：${parts.join("；")}`;
}

export function profileSummary(profile: WorkProfile): string {
  return referencesSummary(profile);
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

export function profileContext(profile: WorkProfile): string {
  return referencesSummary(profile);
}

export { contentSpecSummary };
