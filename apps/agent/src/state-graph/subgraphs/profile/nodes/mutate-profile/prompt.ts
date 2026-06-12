/** profile 子图：按意图修改方案的 LLM 提示词 */
import type { WorkProfile } from "@yougan/domain";

import {
  profileDeliverySummary,
  profileExpressionSummary,
  profileGuardrailsSummary,
  profileParamsSummary,
  profileSegmentsSummary,
  profileSettingsSummary,
} from "#agent/prompts/profile-summary.js";
import {
  composeSystemPrompt,
  YOUGAN_USER_LABEL,
} from "#agent/system-prompt.js";
import { getLatestHumanMessageText } from "#agent/messages/human.js";
import { getProfile } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import { deliveryTaxonomyPrompt } from "../run-profile-tools/tools/schemas.js";

function buildMutateProfileActionPrompt(profile: WorkProfile, userMessage: string): string {
  const summary = profile.blueprint.summary.trim() || "（尚无）";

  return `当前任务：按${YOUGAN_USER_LABEL}意图修改作品方案（WorkProfile）

**职责**：解析最新消息中的方案变更意图，通过原子工具写入 staging.profile；不负责给建议、不负责完整回复感友。

**设定 vs 结构**
- 创作设定（settings）：背景、对象、关键要素等**固定**信息
- 结构段（segments）：内容走向、段落节拍、分镜顺序
- 不要把对象/背景写进 segments；不要把结构大纲写进 settings

**交付规格（update_profile_delivery）与内容定位（update_profile_summary）**
- 感友描述创作意图时：delivery 写 topic、format、modalities（及 platform/category 若可判断）；summary 写一句话内容定位（归纳创作方向与要求）
- topic 是短题眼；summary 是完整定位句；二者勿重复堆砌
- 当前 delivery 缺 format 或 modalities 时，只要消息含体裁/形式线索就必须补齐

${deliveryTaxonomyPrompt}

**工具原则**
- 每个工具只做一件事；多种变更可一轮多次 tool_call
- 换方向：组合 update_profile_delivery、update_profile_summary、replace_profile_settings、replace_profile_segments 等
- 删一条：delete_profile_setting / delete_profile_segment / delete_profile_guardrail（带 id）
- 改一条：update_profile_* 或 append_profile_*
- 无变更意图 → 不调用工具，简短说明无改动即可
- 禁止向${YOUGAN_USER_LABEL}给调整建议或完整回合回复（后续 summarize 节点负责）

**工具一览**
- update_profile_delivery / update_profile_summary / update_profile_expression / update_profile_params
- clear_profile_settings、replace_profile_settings、append_profile_setting、update_profile_setting、delete_profile_setting
- clear_profile_segments、replace_profile_segments、append_profile_segment、update_profile_segment、delete_profile_segment
- clear_profile_guardrails、replace_profile_guardrails、append_profile_guardrail、update_profile_guardrail、delete_profile_guardrail

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

${YOUGAN_USER_LABEL}最新消息：
${userMessage || "（无文字）"}`;
}

export function buildMutateProfilePrompt(state: AgentStateType): string {
  return composeSystemPrompt(
    buildMutateProfileActionPrompt(
      getProfile(state),
      getLatestHumanMessageText(state.messages).trim(),
    ),
  );
}
