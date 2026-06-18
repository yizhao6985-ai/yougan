/** profile 子图：按意图修改方案的 LLM 提示词 */
import type { WorkProfile } from "@yougan/domain";
import { buildProfileStepPromptSection } from "@yougan/domain";

import {
  profileBoundsSummary,
  profileContextSummary,
  profileDirectionSummary,
  profileSequenceSummary,
  profileStyleSummary,
} from "#agent/prompts/profile-summary.js";
import {
  composeSystemPrompt,
  YOUGAN_USER_LABEL,
} from "#agent/system-prompt.js";
import { getLatestHumanMessageText } from "#agent/messages/human.js";
import { getProfile } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import { formatTaxonomyPrompt } from "../run-profile-tools/tools/schemas.js";

function buildMutateProfileActionPrompt(profile: WorkProfile, userMessage: string): string {
  return `当前任务：按${YOUGAN_USER_LABEL}意图修改作品方案（WorkProfile）

${buildProfileStepPromptSection(profile)}

**职责**：解析最新消息中的方案变更意图，通过**五步方案工具**写入 staging.profile；优先补齐**当前方案步骤**缺口，但不禁止跨步更新；不负责给建议、不负责完整回复感友。

**步骤与工具（一步一工具，与侧栏方案向导对应）**
- ① 方向：update_profile_direction（summary、format、audience；summary/format 为就绪必填）
- ② 风格：update_profile_style（verbal 文字风格、visual 画面方向）
- ③ 背景：update_profile_context（世界设定、品牌、人设等正向离散 items）
- ④ 节拍：update_profile_sequence（有序内容意图 items；role 可选 text/image/audio/video；软参考）
- ⑤ 边界：update_profile_bounds（反向离散 items：不要、避免、红线）

${formatTaxonomyPrompt}

**工具原则**
- 每步有独立工具；同一步的变更合并为**该步工具的单次调用**（勿拆成多个工具）
- 无变更意图 → 不调用工具
- 节拍是软参考，不承诺与成稿 block 一一对应
- 禁止向${YOUGAN_USER_LABEL}给调整建议或完整回合回复（后续 summarize 节点负责）

**当前方案**
① 方向：${profileDirectionSummary(profile)}

② 风格：${profileStyleSummary(profile)}

③ 背景：
${profileContextSummary(profile)}

④ 节拍：
${profileSequenceSummary(profile)}

⑤ 边界：
${profileBoundsSummary(profile)}

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
