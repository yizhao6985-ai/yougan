import type { BaseMessage } from "@langchain/core/messages";

import type { AgentStateType } from "#agent/state.js";

import { semanticMessageChars, semanticMessages } from "./message-semantics.js";

/** 语义消息条数超过此值时触发压缩 */
export const MESSAGE_COUNT_THRESHOLD = 24;

/** 语义消息总字符超过此值时触发压缩（兜底） */
export const MESSAGE_CHARS_THRESHOLD = 40_000;

/** 摘要后保留最近 N 条消息原文（含 tool，简单按 raw slice） */
export const KEEP_RECENT_MESSAGES = 8;

export function messagesExceedSummaryThreshold(messages: BaseMessage[]): boolean {
  const semantic = semanticMessages(messages);
  if (semantic.length === 0) return false;

  if (semantic.length > MESSAGE_COUNT_THRESHOLD) return true;
  return semanticMessageChars(messages) > MESSAGE_CHARS_THRESHOLD;
}

export function needsMessageSummary(state: AgentStateType): boolean {
  if (state.turn.cancelled) return false;

  const messages = state.messages ?? [];
  if (messages.length === 0) return false;

  return messagesExceedSummaryThreshold(messages);
}
