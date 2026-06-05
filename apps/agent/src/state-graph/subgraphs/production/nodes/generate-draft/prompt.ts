import {
  getProfilePremise,
  getPlanSummary,
  profileSummary,
  resolveContentSpecFromProfile,
  type ContentFormatId,
  type WorkProductionPlan,
  type WorkProfile,
} from "@yougan/domain";

import { buildFormatGenerationGuidance } from "../llm-call/format-guidance.js";

export function buildGenerateDraftPrompt(input: {
  profile: WorkProfile;
  plan: WorkProductionPlan;
}): string {
  const { profile, plan } = input;
  const contentProfile = resolveContentSpecFromProfile(profile);
  const refSummaries = (profile.references ?? [])
    .slice(0, 5)
    .map((r) => `- ${r.summary}`)
    .join("\n");
  const pending = plan.pending_tasks.map((c) => `- ${c.description}`).join("\n");
  const industry = plan.industry_context ?? "";
  const formatGuidance = buildFormatGenerationGuidance(
    contentProfile.content_format as ContentFormatId | null,
    contentProfile.media_modalities?.[0] ?? null,
  );

  return `生成创作成稿（文案总监执行）。

作品方案：${getProfilePremise(profile) ?? profileSummary(profile)}
创作计划摘要：${getPlanSummary(plan) ?? "无"}

待执行任务（必须全部体现）：
${pending}

主题：${contentProfile.content_topic}
体裁：${contentProfile.content_format ?? "未指定"}
媒介形式：${contentProfile.media_modalities?.join(",") ?? "未指定"}
风格：${profile.voice.style ?? "未指定"}；语气：${profile.voice.tone ?? "未指定"}
受众：${profile.voice.audience ?? "未指定"}
行业背景：${industry || "无"}
参考：${refSummaries || "无"}

写作要求：
${formatGuidance}

请生成完整成稿，包含 title、body、hashtags、hook、notes 字段。`;
}
