/** profile 子图 LLM 系统提示词 */
import type { WorkProfile } from "@yougan/domain";

import {
  profileDeliverySummary,
  profileExpressionSummary,
  profileGuardrailsSummary,
  profileParamsSummary,
  profileReferencesSummary,
  profileSegmentsSummary,
} from "@yougan/domain";
import {
  composeSystemPrompt,
  YOUGAN_USER_LABEL,
} from "#agent/system-prompt.js";
import { getProfile, getReferences } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

function buildProfileActionPrompt(
  profile: WorkProfile,
  references: ReturnType<typeof getReferences>,
): string {
  const summary = profile.blueprint.summary.trim() || "（尚无）";

  return `当前任务：作品方案对话（维护 WorkProfile）

**职责**：与${YOUGAN_USER_LABEL}一起维护作品方案（交付规格、表达设定、内容定位、内容结构、创作规则、体裁参数）。参考素材已由 reference 子图分析入库，可阅读下方摘要并据此调整方案。

**工具**
- 作品方案 → **profile_apply_patch**（唯一入口；至少传一个字段）
  - delivery: { topic?, format?, modalities?, platform?, category?, intent? }（未提发布渠道时不要写 platform）
  - expression: { audience?, verbal_tone?, verbal_style?, verbal_persona?, visual_style?, visual_mood?, visual_palette? }
  - summary: 一句话内容定位
  - 结构段：segments_replace（整体替换）| segments_append | segment_updates[{ segment_id, description }] | segment_deletes[id] | clear_segments
  - 创作规则：guardrails_replace（整体替换）| guardrails_append | guardrail_updates[{ guardrail_id, description }] | guardrail_deletes[id] | clear_guardrails
  - 体裁参数：kind, word_count_min, word_count_max, emoji_level, aspect_ratio, image_count, negative_hints, duration_sec, pacing, segment_count
  - 改/删结构段或规则时，segment_id / guardrail_id 必须从下方「含 id」列表原样复制
- 用户要删参考素材 → 说明可在对话中提出，系统会走 reference 流程
- 用户想出稿/改稿 → 引导继续输入，系统会根据修改对象自动路由到制作模式
- 禁止制作执行类工具（add_plan_task、generate_draft 等）

**常见场景（尽量一次 profile_apply_patch）**
- 换选题/换方向：delivery + summary + segments_replace；规则不适用则 guardrails_replace（或 clear_guardrails + guardrails_append）
- 删一条结构段/规则：segment_deletes / guardrail_deletes（带 id）
- 只改结构：segments_replace，或 segment_updates / segment_deletes
- 只改语气受众：expression
- 只改体裁参数：kind、word_count_min/max 等顶层字段
- 根据参考素材改画风/语气：expression（结合下方参考摘要）

当前方案：
内容定位：${summary}

交付规格：
${profileDeliverySummary(profile)}

表达设定：
${profileExpressionSummary(profile)}

体裁参数：
${profileParamsSummary(profile)}

${profileSegmentsSummary(profile)}

${profileGuardrailsSummary(profile)}

${profileReferencesSummary(references)}

**回复结构**
1. 1–2 句承接用户对方案的关注点
2. 给出具体调整建议
3. 引导在侧栏查看方案，或点选快捷建议继续`;
}

export function buildProfilePrompt(state: AgentStateType): string {
  const profile = getProfile(state);
  const references = getReferences(state);
  return composeSystemPrompt(buildProfileActionPrompt(profile, references));
}
