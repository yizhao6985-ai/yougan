import {
  getProfileSummary,
  getPlanSummary,
  resolveDeliveryFromProfile,
  type ContentFormatId,
  type WorkProductionPlan,
  type WorkProfile,
  type WorkReference,
} from "@yougan/domain";
import { profileSummary } from "#agent/prompts/profile-summary.js";

import { buildFormatGenerationGuidance } from "../../helpers/format-guidance.js";

export function buildGenerateDraftPrompt(input: {
  profile: WorkProfile;
  references: WorkReference[];
  plan: WorkProductionPlan;
}): string {
  const { profile, references, plan } = input;
  const delivery = resolveDeliveryFromProfile(profile);
  const refSummaries = references
    .slice(0, 5)
    .map(
      (r) =>
        `- 分析：${r.analysis.summary}；意图：${r.intent.summary}`,
    )
    .join("\n");
  const pending = plan.pending_tasks.map((c) => `- ${c.description}`).join("\n");
  const formatGuidance = buildFormatGenerationGuidance(
    delivery.format as ContentFormatId | null,
    delivery.modalities?.[0] ?? null,
  );
  const guardrails = profile.guardrails
    .filter((g) => g.scope === "all" || g.scope === "verbal")
    .map((g) => `- ${g.description}`)
    .join("\n");
  const settings = profile.blueprint.settings
    .map((s) => {
      const kind =
        s.kind === "character" ? "对象" : s.kind === "world" ? "背景" : "设定";
      const name = s.title?.trim();
      return `- [${kind}${name ? ` · ${name}` : ""}] ${s.description}`;
    })
    .join("\n");

  return `生成创作成稿（文字内容制作执行）。

作品方案：${getProfileSummary(profile) ?? profileSummary(profile, references)}
创作计划摘要：${getPlanSummary(plan) ?? "无"}

待执行任务（必须全部体现）：
${pending}

主题：${delivery.topic}
体裁：${delivery.format ?? "未指定"}
媒介形式：${delivery.modalities?.join(",") ?? "未指定"}
风格：${profile.expression.verbal?.style ?? "未指定"}；语气：${profile.expression.verbal?.tone ?? "未指定"}
受众：${profile.expression.audience ?? "未指定"}
参考：${refSummaries || "无"}

创作设定：
${settings || "无"}

创作规则：
${guardrails || "无"}

体裁与媒介要求：
${formatGuidance}

请生成完整成稿，包含 title、body、hashtags、hook、notes 字段。`;
}
