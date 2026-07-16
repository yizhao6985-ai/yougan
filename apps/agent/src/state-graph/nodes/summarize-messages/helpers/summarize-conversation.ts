import { HumanMessage, RemoveMessage, type BaseMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import type { AgentStateType } from "#agent/state.js";

import { buildSummarizeMessagesPrompt } from "../prompt.js";
import { ConversationSummarySchema } from "../schema.js";
import {
  isSemanticMessage,
  isToolInternalMessage,
} from "./message-semantics.js";
import {
  KEEP_RECENT_MESSAGES,
  messagesExceedSummaryThreshold,
  needsMessageSummary,
} from "./needs-message-summary.js";

function messagesToSummarize(messages: BaseMessage[]): BaseMessage[] {
  if (messages.length <= KEEP_RECENT_MESSAGES) return [];
  return messages.slice(0, -KEEP_RECENT_MESSAGES);
}

function removeMessageUpdates(messages: BaseMessage[]): RemoveMessage[] {
  return messages
    .filter((message) => message.id)
    .map((message) => new RemoveMessage({ id: message.id! }));
}

function messagesAfterRemoving(
  messages: BaseMessage[],
  toRemove: BaseMessage[],
): BaseMessage[] {
  const removeIds = new Set(
    toRemove.map((message) => message.id).filter(Boolean),
  );
  if (removeIds.size === 0) return messages;

  return messages.filter(
    (message) => !message.id || !removeIds.has(message.id),
  );
}

/** 对话过长时：先删 batch 内 tool 消息；仍超阈值再 LLM 滚动摘要 */
export async function resolveConversationSummary(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<Partial<AgentStateType> | null> {
  if (!needsMessageSummary(state)) {
    return null;
  }

  const messages = state.messages ?? [];
  const batch = messagesToSummarize(messages);
  if (batch.length === 0) {
    return null;
  }

  const toolInBatch = batch.filter(isToolInternalMessage);
  const messagesAfterToolRemove = messagesAfterRemoving(messages, toolInBatch);

  if (!messagesExceedSummaryThreshold(messagesAfterToolRemove)) {
    const toolRemoves = removeMessageUpdates(toolInBatch);
    return toolRemoves.length > 0 ? { messages: toolRemoves } : null;
  }

  const semanticBatch = batch.filter(isSemanticMessage);
  if (semanticBatch.length === 0) {
    const toolRemoves = removeMessageUpdates(toolInBatch);
    return toolRemoves.length > 0 ? { messages: toolRemoves } : null;
  }

  const llm = createChatModel({ temperature: 0.2 });
  const prompt = buildSummarizeMessagesPrompt({
    previousSummary: state.conversationSummary,
    messages: semanticBatch,
  });

  const parsed = await invokeStructured(
    llm,
    ConversationSummarySchema,
    [new HumanMessage(prompt)],
    { name: "summarize_conversation" },
    config,
  );

  return {
    conversationSummary: parsed.summary.trim(),
    messages: removeMessageUpdates(batch),
  };
}

/** LLM 失败回退：仅清理 batch 内 tool 消息 */
export function summarizeConversationTimeoutFallback(
  state: AgentStateType,
): Partial<AgentStateType> | null {
  if (!needsMessageSummary(state)) return null;
  const messages = state.messages ?? [];
  const batch = messagesToSummarize(messages);
  if (batch.length === 0) return null;
  const toolInBatch = batch.filter(isToolInternalMessage);
  const toolRemoves = removeMessageUpdates(toolInBatch);
  return toolRemoves.length > 0 ? { messages: toolRemoves } : null;
}
