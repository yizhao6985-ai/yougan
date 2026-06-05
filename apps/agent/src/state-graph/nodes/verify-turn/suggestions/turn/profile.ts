/**
 * profile 回合结束后：根据 AI 回复生成下一步可点击建议。
 */
/** 仅完成 profile 子图时的专用下一步建议（4 条） */
import { HumanMessage } from "@langchain/core/messages";

import {
  DEFAULT_NEXT_STEP_SUGGESTIONS_HINT,
  isProfileActionable,
  newNextStepSuggestion,
  type NextStepSuggestions,
} from "@yougan/domain";

import { createStructuredModel } from "#agent/model/dashscope.js";
import { invokeStructuredOutput } from "#agent/llm/structured-output.js";
import {
  profileSummary,
  referencesSummary,
} from "@yougan/domain";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import type { AgentStateType } from "#agent/state.js";
import { parseProfile } from "#agent/runtime/state-readers.js";
import { extractLastMessages } from "../extract-last-messages.js";
import {
  TurnNextStepSuggestionsResponseSchema,
  TURN_NEXT_STEP_SUGGESTIONS_COUNT,
} from "../schema.js";

function buildAfterProfileTurnSuggestionsPrompt(
  state: AgentStateType,
  lastAssistantReply: string,
  lastUserMessage: string,
): string {
  const profile = parseProfile(state);

  return `你是「有感 Yougan」作品方案搭子。profile 模式回合已结束，请根据**上一条 AI 回复**，生成 ${TURN_NEXT_STEP_SUGGESTIONS_COUNT} 条**下一步工作**可点击建议。

${profileSummary(profile)}
${referencesSummary(profile.references)}

${YOUGAN_USER_LABEL}上一条消息：
${lastUserMessage || "（无）"}

方案节点刚回复的全文：
${lastAssistantReply}

生成要求：
1. 优先引导修改方案（explore：规格/要求/节拍），或 navigate（方案已可执行时开始出稿）
2. message 须点名**具体主题或要点**，像用户亲自打字；禁止序数指代而不写清内容
3. label 仅结构化摘要（≤10 字）；前端只展示 message
4. message：用户点击后原样写入对话的完整口语化中文
5. hint：仅一行操作指引（≤14 字）`;
}

function fallbackAfterProfileTurnSuggestions(
  state: AgentStateType,
): NextStepSuggestions {
  const profile = parseProfile(state);
  const actionable = isProfileActionable(profile);

  return {
    hint: DEFAULT_NEXT_STEP_SUGGESTIONS_HINT,
    suggestions:
      actionable
        ? [
            newNextStepSuggestion(
              "explore",
              "改节拍",
              "第二节我想改成讲性价比而不是成分，帮我更新方案",
            ),
            newNextStepSuggestion(
              "explore",
              "加要求",
              "加一条写作要求：语气更口语，不要硬广",
            ),
            newNextStepSuggestion(
              "navigate",
              "开始出稿",
              "方案差不多了，按当前方案开始制作吧",
            ),
            newNextStepSuggestion(
              "explore",
              "改定位",
              "一句话定位我想改成通勤场景种草，帮我更新",
            ),
          ]
        : [
            newNextStepSuggestion(
              "explore",
              "定主题",
              "还没定清楚这篇要写什么，结合刚才讨论帮我写进方案",
            ),
            newNextStepSuggestion(
              "explore",
              "定结构",
              "帮我把刚才讨论的方向整理成 4 个内容节拍",
            ),
            newNextStepSuggestion(
              "explore",
              "补要求",
              "帮我补 2 条这篇必须遵守的写作要求",
            ),
            newNextStepSuggestion(
              "explore",
              "再对比",
              "帮我把刚才几个方向的受众和风险再对比一下",
            ),
          ],
  };
}

export async function generateAfterProfileTurnSuggestions(
  state: AgentStateType,
): Promise<NextStepSuggestions | null> {
  const { lastAssistant, lastUser } = extractLastMessages(state);
  if (!lastAssistant.trim()) return null;

  const llm = createStructuredModel({ temperature: 0.6 });
  const prompt = buildAfterProfileTurnSuggestionsPrompt(
    state,
    lastAssistant,
    lastUser,
  );

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      TurnNextStepSuggestionsResponseSchema,
      [new HumanMessage(prompt)],
      { name: "turn_next_step_suggestions" },
    );
    return {
      hint: parsed.hint?.trim() || DEFAULT_NEXT_STEP_SUGGESTIONS_HINT,
      suggestions: parsed.suggestions.map((s) =>
        newNextStepSuggestion(s.kind, s.label, s.message),
      ),
    };
  } catch {
    return fallbackAfterProfileTurnSuggestions(state);
  }
}
