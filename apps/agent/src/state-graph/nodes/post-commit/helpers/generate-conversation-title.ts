import { HumanMessage } from "@langchain/core/messages";

import {
  fallbackConversationTitleFromText,
  isDefaultConversationTitle,
  sanitizeAutoConversationTitle,
} from "@yougan/domain";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import {
  getHumanMessageContents,
  getLatestHumanMessageAttachments,
  getLatestHumanMessageText,
} from "#agent/messages/human.js";
import type { AgentStateType } from "#agent/state.js";

import { extractLastMessages } from "../../../subgraphs/suggestions/nodes/generate-suggestions/helpers/extract-last-messages.js";
import { buildGenerateConversationTitlePrompt } from "./generate-conversation-title/prompt.js";
import { ConversationTitleResponseSchema } from "./generate-conversation-title/schema.js";

export function needsConversationTitle(state: AgentStateType): boolean {
  const title = state.conversationTitle?.trim() ?? "";
  if (!isDefaultConversationTitle(title)) return false;
  return getHumanMessageContents(state.messages).length === 1;
}

function fallbackTitle(
  userMessage: string,
  hasAttachments: boolean,
): string | null {
  const fromText = fallbackConversationTitleFromText(userMessage);
  if (fromText) return fromText;
  if (hasAttachments) {
    return sanitizeAutoConversationTitle("参考素材讨论");
  }
  return null;
}

/** 首条 human 且占位标题时，生成对话标题建议 */
export async function resolveConversationTitle(
  state: AgentStateType,
): Promise<string | null> {
  if (!needsConversationTitle(state)) {
    return null;
  }

  const userMessage = getLatestHumanMessageText(state.messages);
  const hasAttachments =
    getLatestHumanMessageAttachments(state.messages).length > 0;
  const { lastAssistant } = extractLastMessages(state);

  const llm = createChatModel({ temperature: 0.2 });
  const prompt = buildGenerateConversationTitlePrompt(
    state,
    userMessage,
    lastAssistant,
    hasAttachments,
  );

  try {
    const parsed = await invokeStructured(
      llm,
      ConversationTitleResponseSchema,
      [new HumanMessage(prompt)],
      { name: "generate_conversation_title" },
    );
    return (
      sanitizeAutoConversationTitle(parsed.conversationTitle) ??
      fallbackTitle(userMessage, hasAttachments)
    );
  } catch {
    return fallbackTitle(userMessage, hasAttachments);
  }
}
