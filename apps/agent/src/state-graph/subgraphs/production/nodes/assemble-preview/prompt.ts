import {
  buildProfileStepPromptSection,
  getDirectionSummary,
  getUserRequirements,
  resolveDeliveryFromProfile,
  type ContentFormatId,
  type TaskDeliverable,
  type WorkProduction,
  type WorkProfile,
} from "@yougan/domain";
import { profileSummary } from "#agent/prompts/profile-summary.js";

import { buildFormatGenerationGuidance } from "../../helpers/format-guidance.js";

export type ConsolidatePromptInput = {
  profile: WorkProfile;
  plan: WorkProduction;
  deliverables: TaskDeliverable[];
};

function buildFragmentsBlock(input: ConsolidatePromptInput): string {
  const { plan, deliverables } = input;
  return deliverables
    .map((d, i) => {
      const task = plan.pending_tasks.find((t) => t.id === d.taskId);
      const isDesign = task?.department === "design";
      const summary = isDesign
        ? d.notes?.trim() || d.title?.trim() || "（视觉交付，成图已单独生成）"
        : d.body;
      return `### 片段 ${i + 1}：${task?.description ?? d.taskId}
${d.title ? `标题建议：${d.title}\n` : ""}${summary}
${!isDesign && d.notes ? `备注：${d.notes}` : ""}`;
    })
    .join("\n\n");
}

/** 整理编辑稳定规则层 */
export function buildConsolidateSystemPrompt(input: {
  profile: WorkProfile;
}): string {
  const { profile } = input;
  const delivery = resolveDeliveryFromProfile(profile);

  return `你是整理编辑，负责为**已通过验收**的作品预览补充元信息。

## 工作要求
- **不要改写或合并**各任务片段正文；片段已按顺序映射为 preview blocks
- 只输出元信息：title、hook、hashtags、notes
- title / hook 应概括整件作品，供列表与分享使用
- hashtags 3–8 个，不带 # 号
- notes 仅放制作侧备注，默认不进公开展示

## 作品方案
${profileSummary(profile)}

体裁：${delivery.format ?? "未指定"}
主题：${getDirectionSummary(profile) || "未指定"}

## 体裁参考
${buildFormatGenerationGuidance(delivery.format as ContentFormatId | null, delivery.modalities?.[0] ?? null, profile)}`;
}

/** 总监工单层：用户要求与待整合片段（按 tasks 顺序） */
export function buildConsolidateHumanPrompt(input: ConsolidatePromptInput): string {
  const { plan } = input;

  return `请根据以下已通过验收的片段，输出作品元信息（不要输出正文）。

用户要求：${getUserRequirements(plan) ?? "无"}

## 已备妥片段
${buildFragmentsBlock(input)}

请按 system 规则输出 title / hook / hashtags / notes。`;
}
