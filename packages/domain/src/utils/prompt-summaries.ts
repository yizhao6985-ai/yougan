import type { WorkProfile } from "../models/work/profile.js";
import type { WorkProductionPlan } from "../models/work/plan.js";
import type { ReferenceItem } from "../models/work/reference.js";
import { getProfilePremise } from "./work/profile.js";
import { getPlanSummary, isPlanReady } from "./work/plan.js";
import {
  contentFormatLabel,
  contentSpecSummary,
  mediaModalitiesLabel,
} from "./content-spec.js";

export function referencesSummary(references: ReferenceItem[] | undefined): string {
  const count = references?.length ?? 0;
  return count ? `参考素材：${count} 条` : "尚无参考素材";
}

export function profileSpecSummary(profile: WorkProfile): string {
  const { spec } = profile;
  const parts = [
    spec.content_topic ? `主题：${spec.content_topic}` : null,
    spec.content_type ? `类型：${spec.content_type}` : null,
    spec.content_format
      ? `体裁：${contentFormatLabel(spec.content_format) ?? spec.content_format}`
      : null,
    spec.media_modalities?.length
      ? `形式：${mediaModalitiesLabel(spec.media_modalities) ?? spec.media_modalities.join(",")}`
      : null,
  ].filter(Boolean);
  return parts.length ? parts.join("；") : "尚未确定创作规格";
}

export function profileVoiceSummary(profile: WorkProfile): string {
  const { voice } = profile;
  const parts = [
    voice.audience ? `受众：${voice.audience}` : null,
    voice.tone ? `语气：${voice.tone}` : null,
    voice.style ? `风格：${voice.style}` : null,
    voice.persona ? `人设：${voice.persona}` : null,
    voice.goals?.length ? `目标：${voice.goals.join("、")}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join("；") : "尚未确定表达设定";
}

export function profileSummary(profile: WorkProfile): string {
  const premise = getProfilePremise(profile);
  const lines: string[] = ["创作轮廓"];
  if (premise) lines.push(`定位：${premise}`);
  lines.push(profileSpecSummary(profile));
  lines.push(profileVoiceSummary(profile));
  if (profile.references.length) {
    lines.push(referencesSummary(profile.references));
  }
  if (profile.constraints.length) {
    lines.push(
      `要求（${profile.constraints.length} 条）：${profile.constraints.map((c) => c.description).join("；")}`,
    );
  }
  if (profile.beats.length) {
    lines.push(
      `结构（${profile.beats.length} 节）：${profile.beats.map((b, i) => `${i + 1}. ${b.description}`).join("；")}`,
    );
  }
  if (
    !premise &&
    !profile.constraints.length &&
    !profile.beats.length &&
    !profile.spec.content_topic
  ) {
    return "尚无作品方案";
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

export function profileContext(references: ReferenceItem[] | undefined): string {
  return referencesSummary(references);
}

export { contentSpecSummary };
