/** profile 子图：按意图修改方案的 LLM 提示词 */
import type { WorkProfile } from "@yougan/domain";
import {
  buildProfileSetupProgressOptions,
  buildProfileStepPromptSection,
} from "@yougan/domain";

import {
  profileBoundsSummary,
  profileDirectionSummary,
  profileRequirementsSummary,
  profileSettingSummary,
  profileStyleSummary,
} from "#agent/prompts/profile-summary.js";
import {
  composeSystemPrompt,
  YOUGAN_USER_LABEL,
} from "#agent/system-prompt.js";
import { getLatestHumanMessageText } from "#agent/messages/human.js";
import { getPreview, getProduction, getProfile } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import { formatTaxonomyPrompt } from "../run-profile-tools/tools/schemas.js";

function buildMutateProfileActionPrompt(
  state: AgentStateType,
  profile: WorkProfile,
  userMessage: string,
): string {
  const profileSetupOptions = buildProfileSetupProgressOptions({
    profile,
    preview: getPreview(state),
    production: getProduction(state),
  });

  return `当前任务：按${YOUGAN_USER_LABEL}意图修改作品方案（WorkProfile）

${buildProfileStepPromptSection(profile, profileSetupOptions)}

**职责**：解析最新消息中的方案变更意图，通过**五步方案工具**写入 staging.profile；优先补齐**当前方案步骤**缺口，但不禁止跨步更新；不负责给建议、不负责完整回复感友。

**步骤与工具（一步一工具，与侧栏方案向导对应；仅可调用下列名称，禁止自造工具名）**
- ① 方向：update_profile_direction（summary、format、audience；summary/format 为开制就绪条件）
- ② 风格：update_profile_style（verbal 文字风格、visual 画面方向）
- ③ 背景：update_profile_setting（品牌事实、故事背景、人设等 items；同 update_profile_background）
- ④ 需求：update_profile_requirements（对成稿的期望：字数、结构顺序、必含模块等 items）
- ⑤ 边界：update_profile_bounds（不要出现的内容、需避免的写法）

${formatTaxonomyPrompt}

**工具原则**
- 每步有独立工具；同一步的变更合并为**该步工具的单次调用**（勿拆成多个工具）
- 无变更意图 → 不调用工具；**禁止**调用未在上文列出的工具（如 finalize_profile、update_profile 等）
- 人物/品牌/世界观写入 setting；字数/结构/顺序写入 requirements；禁止项写入 bounds
- 禁止向${YOUGAN_USER_LABEL}给调整建议或完整回合回复；无 tool_calls 时不要输出对用户可见的文字

**当前方案**
① 方向：${profileDirectionSummary(profile)}

② 风格：${profileStyleSummary(profile)}

③ 背景：
${profileSettingSummary(profile)}

④ 需求：
${profileRequirementsSummary(profile)}

⑤ 边界：
${profileBoundsSummary(profile)}

${YOUGAN_USER_LABEL}最新消息：
${userMessage || "（无文字）"}`;
}

export function buildMutateProfilePrompt(state: AgentStateType): string {
  return composeSystemPrompt(
    buildMutateProfileActionPrompt(
      state,
      getProfile(state),
      getLatestHumanMessageText(state.messages).trim(),
    ),
  );
}
