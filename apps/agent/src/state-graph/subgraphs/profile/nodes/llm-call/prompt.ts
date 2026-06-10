/** profile 子图 LLM 系统提示词 */
import type { WorkProfile } from "@yougan/domain";

import {
  profileDeliverySummary,
  profileExpressionSummary,
  profileGuardrailsSummary,
  profileParamsSummary,
  profileReferencesSummary,
  profileSegmentsSummary,
  profileSettingsSummary,
} from "#agent/prompts/profile-summary.js";
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

**职责**：与${YOUGAN_USER_LABEL}一起维护作品方案（交付规格、表达设定、内容定位、创作设定、内容结构、创作规则、体裁参数）。参考素材已由 reference 子图分析入库，可阅读下方摘要并据此调整方案。

**设定 vs 结构**
- 创作设定（settings）：背景、对象、关键要素等**固定**信息，与篇幅顺序无关
- 内容结构（segments）：段落、步骤、情节节拍等**内容走向**，按顺序排列
- 不要把对象/背景说明写进 segments；不要把结构大纲写进 settings

**流程**
- 方案变更一律调用 profile_apply_patch；尽量一次调用覆盖本轮改动
- 删参考素材 → 说明可在对话中提出，系统会走 reference 流程
- 出稿/改稿 → 引导继续输入，系统会根据修改对象自动路由到制作模式

**常见场景**
- 换选题/换方向：delivery + summary + settings_replace + segments_replace；规则不适用则 guardrails_replace（或 clear_guardrails + guardrails_append）
- 背景/对象/关键要素：settings_append 或 settings_replace（kind: character / world）
- 删一条设定/结构段/规则：setting_deletes / segment_deletes / guardrail_deletes（带 id）
- 只改结构：segments_replace，或 segment_updates / segment_deletes
- 只改固定设定：settings_replace，或 setting_updates / setting_deletes
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

${profileSettingsSummary(profile)}

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
