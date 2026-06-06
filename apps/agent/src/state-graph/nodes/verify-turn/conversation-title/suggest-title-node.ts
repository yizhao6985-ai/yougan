import { HumanMessage } from "@langchain/core/messages";

import {
  fallbackConversationTitleFromText,
  MAX_CONVERSATION_TITLE_LENGTH,
  sanitizeAutoConversationTitle,
} from "@yougan/domain";

import { createStructuredModel } from "#agent/model/dashscope.js";
import { shouldSuggestConversationTitle } from "./should-suggest-title.js";
import {
  getLatestHumanMessageImageUrls,
  getLatestHumanMessageText,
} from "#agent/messages/human.js";
import { invokeStructuredOutput } from "#agent/llm/structured-output.js";
import { profileSummary } from "@yougan/domain";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import { getProfile } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";
import { extractLastMessages } from "../suggestions/extract-last-messages.js";
import { ConversationTitleResponseSchema } from "./schema.js";

function buildConversationTitlePrompt(
  state: AgentStateType,
  userMessage: string,
  lastAssistantReply: string,
  hasImages: boolean,
): string {
  const profile = getProfile(state);
  const conversationTitle = state.conversationTitle?.trim() || "（未命名）";

  return `你是「有感 Yougan」对话标题助手。用户在本对话的**首条发言**后，需要把占位标题「${conversationTitle}」替换为简短主题名。

${profileSummary(profile)}

${YOUGAN_USER_LABEL}首条消息：
${userMessage || (hasImages ? "（仅上传图片，无文字说明）" : "（空）")}

AI 本轮回复（节选，供理解话题）：
${lastAssistantReply.trim() || "（尚无可见回复）"}

输出要求：
- conversationTitle：不超过 ${MAX_CONVERSATION_TITLE_LENGTH} 字的中文短语，概括创作主题（总结，不要照抄整句）
- 仅图片无文字时，可写如「参考图选题讨论」
- 不要引号、不要含「对话」字样`;
}

function fallbackTitle(
  userMessage: string,
  hasImages: boolean,
): string | null {
  const fromText = fallbackConversationTitleFromText(userMessage);
  if (fromText) return fromText;
  if (hasImages) {
    return sanitizeAutoConversationTitle("参考图讨论");
  }
  return null;
}

/** 首条用户消息且占位标题时，在回合末生成建议对话标题 */
export async function generateSuggestedConversationTitle(
  state: AgentStateType,
): Promise<string | null> {
  if (!shouldSuggestConversationTitle(state)) {
    return null;
  }

  const userMessage = getLatestHumanMessageText(state.messages);
  const hasImages =
    getLatestHumanMessageImageUrls(state.messages).length > 0;
  const { lastAssistant } = extractLastMessages(state);

  const llm = createStructuredModel({ temperature: 0.2 });
  const prompt = buildConversationTitlePrompt(
    state,
    userMessage,
    lastAssistant,
    hasImages,
  );

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      ConversationTitleResponseSchema,
      [new HumanMessage(prompt)],
      { name: "conversation_title_suggestion" },
    );
    const suggested =
      sanitizeAutoConversationTitle(parsed.conversationTitle) ??
      fallbackTitle(userMessage, hasImages);
    return suggested;
  } catch {
    return fallbackTitle(userMessage, hasImages);
  }
}
