/**
 * 作品方案 / blueprint 回合结束后：根据 AI 回复生成下一步可点击建议。
 */
import { HumanMessage } from "@langchain/core/messages";

import { createStructuredModel } from "#agent/llm/dashscope.js";
import { invokeStructuredOutput } from "#agent/lib/structured-output.js";
import {
  DEFAULT_BRIEF_SUGGESTIONS_HINT,
  isBlueprintActionable,
  newBriefSuggestion,
  type BriefSuggestions,
} from "@yougan/domain";
import {
  blueprintSummary,
  referencesSummary,
} from "#agent/prompt/context.js";
import { YOUGAN_USER_LABEL } from "#agent/prompt/persona.js";
import type { AgentStateType } from "#agent/state.js";
import { parseBlueprint, parseProfile } from "#agent/lib/parse-agent-state.js";
import { extractLastMessages } from "../shared/extract-last-messages.js";
import {
  TurnNextStepSuggestionsResponseSchema,
  TURN_NEXT_STEP_SUGGESTIONS_COUNT,
} from "../shared/schema.js";
import { MAX_NEXT_STEP_SUGGESTION_LENGTH } from "@yougan/domain";
import { sanitizeNextStepSuggestions } from "../shared/sanitize-suggestions.js";

function buildAfterBlueprintTurnSuggestionsPrompt(
  state: AgentStateType,
  lastAssistantReply: string,
  lastUserMessage: string,
): string {
  const profile = parseProfile(state);
  const blueprint = parseBlueprint(state);

  return `你是「有感 Yougan」作品方案搭子。blueprint 模式回合已结束，请根据**上一条 AI 回复**，生成 ${TURN_NEXT_STEP_SUGGESTIONS_COUNT} 条**下一步工作**可点击建议。

${blueprintSummary(blueprint)}
${referencesSummary(profile)}

${YOUGAN_USER_LABEL}上一条消息：
${lastUserMessage || "（无）"}

方案节点刚回复的全文：
${lastAssistantReply}

生成要求：
1. 优先引导修改方案（explore：规格/要求/节拍），或 navigate（方案已可执行时开始出稿）
2. message 须点名**具体主题或要点**，像用户亲自打字；禁止序数指代而不写清内容
3. label 仅结构化摘要（≤10 字）；前端只展示 message
4. message：用户点击后原样写入对话的完整口语化中文，**不超过 ${MAX_NEXT_STEP_SUGGESTION_LENGTH} 字**
5. hint：仅一行操作指引（≤14 字）`;
}

function fallbackAfterBlueprintTurnSuggestions(
  state: AgentStateType,
): BriefSuggestions {
  const blueprint = parseBlueprint(state);
  const actionable = isBlueprintActionable(blueprint);

  return {
    hint: DEFAULT_BRIEF_SUGGESTIONS_HINT,
    suggestions: sanitizeNextStepSuggestions(
      actionable
        ? [
            newBriefSuggestion(
              "explore",
              "改节拍",
              "第二节我想改成讲性价比而不是成分，帮我更新方案",
            ),
            newBriefSuggestion(
              "explore",
              "加要求",
              "加一条写作要求：语气更口语，不要硬广",
            ),
            newBriefSuggestion(
              "navigate",
              "开始出稿",
              "方案差不多了，按当前方案开始制作吧",
            ),
            newBriefSuggestion(
              "explore",
              "改定位",
              "一句话定位我想改成通勤场景种草，帮我更新",
            ),
          ]
        : [
            newBriefSuggestion(
              "explore",
              "定主题",
              "还没定清楚这篇要写什么，结合刚才讨论帮我写进方案",
            ),
            newBriefSuggestion(
              "explore",
              "定结构",
              "帮我把刚才讨论的方向整理成 4 个内容节拍",
            ),
            newBriefSuggestion(
              "explore",
              "补要求",
              "帮我补 2 条这篇必须遵守的写作要求",
            ),
            newBriefSuggestion(
              "explore",
              "再对比",
              "帮我把刚才几个方向的受众和风险再对比一下",
            ),
          ],
    ),
  };
}

export async function generateAfterBlueprintTurnSuggestions(
  state: AgentStateType,
): Promise<BriefSuggestions | null> {
  const { lastAssistant, lastUser } = extractLastMessages(state);
  if (!lastAssistant.trim()) return null;

  const llm = createStructuredModel({ temperature: 0.6 });
  const prompt = buildAfterBlueprintTurnSuggestionsPrompt(
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
      hint: parsed.hint?.trim() || DEFAULT_BRIEF_SUGGESTIONS_HINT,
      suggestions: sanitizeNextStepSuggestions(
        parsed.suggestions.map((s) =>
          newBriefSuggestion(s.kind, s.label, s.message),
        ),
      ),
    };
  } catch {
    return fallbackAfterBlueprintTurnSuggestions(state);
  }
}
