/** profile 子图：按意图修改方案的 LLM 提示词 */
import type { WorkProfile } from "@yougan/domain";
import { buildProfileStepPromptSection } from "@yougan/domain";

import {
  profileConstraintsSummary,
  profileDeliveryStepSummary,
  profileExpressionSummary,
  profileIntentSummary,
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
  return `当前任务：按${YOUGAN_USER_LABEL}意图修改作品方案（WorkProfile，按步骤组织）

${buildProfileStepPromptSection(profile)}

**职责**：解析最新消息中的方案变更意图，通过**五步方案工具**写入 staging.profile；优先补齐**当前方案步骤**缺口，但不禁止跨步更新；不负责给建议、不负责完整回复感友。

**步骤与工具（一步一工具，与侧栏方案向导对应）**
- ① 创作定位：update_profile_intent（summary 必填，须从${YOUGAN_USER_LABEL}消息凝练）
- ② 内容形态与规格：update_profile_delivery（format、modalities 与分媒介 media_params **同次写入**；不写发布平台）
- ③ 表达设定：update_profile_expression
- ④ 结构与要素：update_profile_structure（settings 固定设定、segments 结构段；segment.role 仅 text / image / audio / video）
- ⑤ 创作规则：update_profile_constraints（rules；scope 用 all / verbal / visual / audio / video，文字规则用 verbal 勿用 text）

**设定 vs 结构（第 4 步）**
- settings：背景、对象、关键要素等**固定**信息
- segments：按作品顺序排列的媒介节拍；每段 role 须为 text / image / audio / video 之一，description 写该段内容要点

${deliveryTaxonomyPrompt}

**工具原则**
- 每步有独立工具；同一步的变更合并为**该步工具的单次调用**（勿拆成多个工具）
- 无变更意图 → 不调用工具
- 禁止向${YOUGAN_USER_LABEL}给调整建议或完整回合回复（后续 summarize 节点负责）

**当前方案**
① 创作定位：${profileIntentSummary(profile)}

② 内容形态与规格：
${profileDeliveryStepSummary(profile)}
媒介规格：${profileParamsSummary(profile)}

③ 表达设定：
${profileExpressionSummary(profile)}

④ 结构与要素：
${profileSettingsSummary(profile)}

${profileSegmentsSummary(profile)}

⑤ 创作规则：
${profileConstraintsSummary(profile)}

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
