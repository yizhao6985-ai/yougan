import {
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
      return `### 片段 ${i + 1}：${task?.description ?? d.taskId}
${d.title ? `标题建议：${d.title}\n` : ""}${d.body}
${d.notes ? `备注：${d.notes}` : ""}`;
    })
    .join("\n\n");
}

/** 整理编辑稳定规则层 */
export function buildConsolidateSystemPrompt(input: {
  profile: WorkProfile;
}): string {
  const { profile } = input;
  const delivery = resolveDeliveryFromProfile(profile);

  return `你是整理编辑，负责将**已通过验收**的单任务片段组织为最终成稿预览。

## 工作要求
- **不要重新创作**，以组织、衔接、排版为主
- 保留各片段的核心内容与总监方向
- 输出完整 preview：title、body、hashtags、hook、notes

## 作品方案
${profileSummary(profile)}

体裁：${delivery.format ?? "未指定"}
主题：${delivery.topic ?? "未指定"}

## 篇幅与体裁要求
${buildFormatGenerationGuidance(delivery.format as ContentFormatId | null, delivery.modalities?.[0] ?? null, profile)}`;
}

/** 总监工单层：用户要求与待整合片段（按 tasks 顺序） */
export function buildConsolidateHumanPrompt(input: ConsolidatePromptInput): string {
  const { plan } = input;

  return `请将以下已通过验收的片段组织为最终成稿（片段顺序即计划任务顺序）。

用户要求：${getUserRequirements(plan) ?? "无"}

## 已备妥片段
${buildFragmentsBlock(input)}

请按 system 规则整合输出。`;
}
