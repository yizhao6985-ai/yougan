/**
 * 大纲模式回合结束后：根据 AI 回复生成可点击建议。
 */
import { HumanMessage } from "@langchain/core/messages";

import { createStructuredModel } from "../../llm/dashscope.js";
import { invokeStructuredOutput } from "../../lib/structured-output.js";
import {
  DEFAULT_BRIEF_SUGGESTIONS_HINT,
  newBriefSuggestion,
  type BriefSuggestions,
} from "../../schema.js";
import { briefSummary, outlineSummary, profileSummary } from "../../prompt/context.js";
import { YOUGAN_USER_LABEL } from "../../prompt/persona.js";
import type { AgentStateType } from "../../state.js";
import { parseBrief, parseOutline, parseProfile } from "../../lib/parse-agent-state.js";
import { extractLastMessages } from "./extract-last-messages.js";
import {
  BriefSuggestionsResponseSchema,
  BRIEF_SUGGESTIONS_COUNT,
} from "./schema.js";
import { dropGenericSupplementOptions } from "./sanitize-suggestions.js";

function buildAfterOutlineSuggestionsPrompt(
  state: AgentStateType,
  lastAssistantReply: string,
  lastUserMessage: string,
): string {
  const profile = parseProfile(state);
  const brief = parseBrief(state);
  const outline = parseOutline(state);

  return `你是「有感 Yougan」大纲搭子。大纲模式回合已结束，请根据**上一条 AI 回复**，生成 ${BRIEF_SUGGESTIONS_COUNT} 条可点击快捷建议。

${briefSummary(brief)}
${profileSummary(profile)}
${outlineSummary(outline)}

${YOUGAN_USER_LABEL}上一条消息：
${lastUserMessage || "（无）"}

大纲节点刚回复的全文：
${lastAssistantReply}

生成要求：
1. 优先引导修改具体大纲条目（explore），或 navigate（如「开始出稿」「继续改结构」）
2. label ≤8 字；message 是用户点击后直接发送的完整口语化中文
3. 禁止「补充想法」类兜底选项；hint 仅一行操作指引（≤14 字）`;
}

function fallbackAfterOutlineSuggestions(): BriefSuggestions {
  return {
    hint: DEFAULT_BRIEF_SUGGESTIONS_HINT,
    suggestions: [
      newBriefSuggestion("explore", "改第一条", "第一条大纲我想改一下，帮我调整"),
      newBriefSuggestion("explore", "加一节", "还想加一节，讲具体案例"),
      newBriefSuggestion("navigate", "开始出稿", "结构差不多了，开始制作吧"),
    ],
  };
}

export async function generateAfterOutlineBriefSuggestions(
  state: AgentStateType,
): Promise<BriefSuggestions | null> {
  const { lastAssistant, lastUser } = extractLastMessages(state);
  if (!lastAssistant.trim()) return null;

  const llm = createStructuredModel({ temperature: 0.6 });
  const prompt = buildAfterOutlineSuggestionsPrompt(state, lastAssistant, lastUser);

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      BriefSuggestionsResponseSchema,
      [new HumanMessage(prompt)],
      { name: "outline_suggestions" },
    );
    return {
      hint: parsed.hint?.trim() || DEFAULT_BRIEF_SUGGESTIONS_HINT,
      suggestions: dropGenericSupplementOptions(
        parsed.suggestions.map((s) =>
          newBriefSuggestion(s.kind, s.label, s.message),
        ),
      ),
    };
  } catch {
    return fallbackAfterOutlineSuggestions();
  }
}
