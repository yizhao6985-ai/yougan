import {
  getPlanSummary,
  resolveDeliveryFromProfile,
  type ContentFormatId,
  type TaskDeliverable,
  type WorkProduction,
  type WorkProfile,
} from "@yougan/domain";
import { profileSummary } from "#agent/prompts/profile-summary.js";

import { buildFormatGenerationGuidance } from "../../helpers/format-guidance.js";

export function buildConsolidatePrompt(input: {
  profile: WorkProfile;
  plan: WorkProduction;
  deliverables: TaskDeliverable[];
}): string {
  const { profile, plan, deliverables } = input;
  const delivery = resolveDeliveryFromProfile(profile);
  const fragments = deliverables
    .map((d, i) => {
      const task = plan.pending_tasks.find((t) => t.id === d.taskId);
      return `### 片段 ${i + 1}：${task?.description ?? d.taskId}
${d.title ? `标题建议：${d.title}\n` : ""}${d.body}
${d.notes ? `备注：${d.notes}` : ""}`;
    })
    .join("\n\n");

  return `你是整理编辑，负责将**已通过验收**的单任务片段组织为最终成稿预览。

要求：
- **不要重新创作**，以组织、衔接、排版为主
- 保留各片段的核心内容与总监方向
- 输出完整 preview：title、body、hashtags、hook、notes

作品方案：${profileSummary(profile)}
计划摘要：${getPlanSummary(plan) ?? "无"}
体裁：${delivery.format ?? "未指定"}
主题：${delivery.topic ?? "未指定"}

篇幅与体裁要求：
${buildFormatGenerationGuidance(delivery.format as ContentFormatId | null, delivery.modalities?.[0] ?? null, profile)}

已备妥片段：
${fragments}`;
}
