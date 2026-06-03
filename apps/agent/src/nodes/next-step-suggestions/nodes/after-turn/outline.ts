/**
 * 大纲模式回合结束后：根据 AI 回复生成下一步可点击建议。
 */
import { HumanMessage } from "@langchain/core/messages";

import { createStructuredModel } from "../../../../llm/dashscope.js";
import { invokeStructuredOutput } from "../../../../lib/structured-output.js";
import {
  DEFAULT_BRIEF_SUGGESTIONS_HINT,
  newBriefSuggestion,
  type BriefSuggestions,
} from "../../../.../shared/schema.js";
import { briefSummary, outlineSummary, profileSummary } from "../../../../prompt/context.js";
import { YOUGAN_USER_LABEL } from "../../../../prompt/persona.js";
import type { AgentStateType } from "../../../../state.js";
import { parseBrief, parseOutline, parseProfile } from "../../../../lib/parse-agent-state.js";
import { extractLastMessages } from "../shared/extract-last-messages.js";
import {
  TurnNextStepSuggestionsResponseSchema,
  TURN_NEXT_STEP_SUGGESTIONS_COUNT,
} from "../shared/schema.js";
import { MAX_NEXT_STEP_SUGGESTION_LENGTH } from "@yougan/domain";
import { sanitizeNextStepSuggestions } from "../shared/sanitize-suggestions.js";

function buildAfterOutlineTurnSuggestionsPrompt(
  state: AgentStateType,
  lastAssistantReply: string,
  lastUserMessage: string,
): string {
  const profile = parseProfile(state);
  const brief = parseBrief(state);
  const outline = parseOutline(state);

  return `你是「有感 Yougan」大纲搭子。大纲模式回合已结束，请根据**上一条 AI 回复**，生成 ${TURN_NEXT_STEP_SUGGESTIONS_COUNT} 条**下一步工作**可点击建议。

${briefSummary(brief)}
${profileSummary(profile)}
${outlineSummary(outline)}

${YOUGAN_USER_LABEL}上一条消息：
${lastUserMessage || "（无）"}

大纲节点刚回复的全文：
${lastAssistantReply}

生成要求：
1. 优先引导修改具体大纲条目（explore），或 navigate（如开始出稿）；message 须点名**章节主题或要点**，像用户亲自打字
2. 禁止「第一条/第二节/第一个」等序数指代而不写清改什么；禁止「补充想法」类兜底
3. label 仅结构化摘要（≤10 字）；前端只展示 message
4. message：用户点击后原样写入对话的完整口语化中文，**不超过 ${MAX_NEXT_STEP_SUGGESTION_LENGTH} 字**
5. hint：仅一行操作指引（≤14 字）`;
}

function fallbackAfterOutlineTurnSuggestions(): BriefSuggestions {
  return {
    hint: DEFAULT_BRIEF_SUGGESTIONS_HINT,
    suggestions: sanitizeNextStepSuggestions([
      newBriefSuggestion(
        "explore",
        "改开头",
        "大纲开头我想改成讲故事开场，帮我改一版表述",
      ),
      newBriefSuggestion(
        "explore",
        "加案例节",
        "我想加一节用真实案例说明核心观点，帮我拟小节要点",
      ),
      newBriefSuggestion(
        "explore",
        "压缩结构",
        "章节有点多，帮我把大纲压缩成 4 节并保留主线",
      ),
      newBriefSuggestion("navigate", "开始出稿", "结构差不多了，按当前大纲开始制作吧"),
    ]),
  };
}

export async function generateAfterOutlineTurnSuggestions(
  state: AgentStateType,
): Promise<BriefSuggestions | null> {
  const { lastAssistant, lastUser } = extractLastMessages(state);
  if (!lastAssistant.trim()) return null;

  const llm = createStructuredModel({ temperature: 0.6 });
  const prompt = buildAfterOutlineTurnSuggestionsPrompt(
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
    return fallbackAfterOutlineTurnSuggestions();
  }
}
