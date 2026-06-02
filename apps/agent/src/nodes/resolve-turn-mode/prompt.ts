import type { ChatMode } from "../../schema.js";
import {
  briefSummary,
  productionPlanSummary,
  profileSummary,
} from "../../prompt/context.js";
import { YOUGAN_USER_LABEL } from "../../prompt/persona.js";
import type { AgentStateType } from "../../state.js";
import {
  parseBrief,
  parseMode,
  parseProductionPlan,
  parseProfile,
} from "../../lib/parse-agent-state.js";

export function buildTurnModePrompt(
  state: AgentStateType,
  userMessage: string,
): string {
  const currentMode = parseMode(state);
  const brief = parseBrief(state);
  const plan = parseProductionPlan(state);
  const profile = parseProfile(state);

  return `你是路由助手，根据${YOUGAN_USER_LABEL}最新一条消息，判断本轮应进入哪种处理流程。

三种流程：
1. inspiration（灵感）：对齐平台、选题、受众、风格；确认/修改 brief 需求；探索方向。不出稿、不执行制作计划。
2. creation（创作）：brief 已定稿或${YOUGAN_USER_LABEL}明确要求出稿/改稿/执行制作计划/调整成稿时。可生成文案、执行任务。
3. ask（提问）：${YOUGAN_USER_LABEL}主要在提问、要建议、要分析、要对比、要背景信息；本轮不应直接出稿，也不应主动写入 brief（除非${YOUGAN_USER_LABEL}明确说「记下来」）。

判断原则：
- 疑问句、求分析、求建议 → 优先 ask
- 明确「开始写/出稿/按计划执行/改标题改语气」→ creation（brief 未定稿时仍可能需先 inspiration，但若${YOUGAN_USER_LABEL} insist 出稿可判 creation）
- 补充选题、确认需求、定方向 → inspiration
- 当前模式 ${currentMode} 仅作参考，以本轮消息意图为准

当前 brief：
${briefSummary(brief)}
brief 定稿：${brief.ready ? "是" : "否"}

${profileSummary(profile)}

制作计划：
${productionPlanSummary(plan)}

${YOUGAN_USER_LABEL}最新一条消息：
${userMessage}`;
}
