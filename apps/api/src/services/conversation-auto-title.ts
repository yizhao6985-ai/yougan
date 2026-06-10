import {
  countHumanCheckpointMessages,
  fallbackConversationTitleFromText,
  getFirstHumanCheckpointMessageText,
  isDefaultConversationTitle,
  sanitizeAutoConversationTitle,
} from "@yougan/domain";

import {
  getWorkConversation,
  updateWorkConversation,
} from "./conversations.js";

/** stream 结束后将 Agent 建议的标题写入占位对话（仅首条用户消息） */
export async function maybeAutoTitleConversation(input: {
  userId: string;
  workId: string;
  conversationId?: string;
  values: Record<string, unknown>;
}) {
  const { userId, workId, conversationId, values } = input;
  if (!conversationId) return;

  const humanCount = countHumanCheckpointMessages(values.messages);
  if (humanCount !== 1) return;

  let generatedTitle = sanitizeAutoConversationTitle(
    values.generatedConversationTitle,
  );
  if (!generatedTitle) {
    generatedTitle = fallbackConversationTitleFromText(
      getFirstHumanCheckpointMessageText(values.messages),
    );
  }
  if (!generatedTitle) return;

  const existing = await getWorkConversation(userId, workId, conversationId);
  if (!existing || !isDefaultConversationTitle(existing.title)) return;

  await updateWorkConversation(userId, workId, conversationId, {
    title: generatedTitle,
  });
}
