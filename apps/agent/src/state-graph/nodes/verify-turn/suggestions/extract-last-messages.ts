/** 从 messages 倒序取最近一条 human / ai 全文（建议与标题生成共用） */
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { messageContentToText } from "#agent/messages/message-content.js";
import type { AgentStateType } from "#agent/state.js";

export function extractLastMessages(state: AgentStateType): {
  lastAssistant: string;
  lastUser: string;
} {
  const messages = state.messages ?? [];
  let lastAssistant = "";
  let lastUser = "";
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const text = messageContentToText(msg.content);
    if (!lastAssistant && AIMessage.isInstance(msg) && text.trim()) {
      lastAssistant = text;
    }
    if (!lastUser && HumanMessage.isInstance(msg) && text.trim()) {
      lastUser = text;
    }
    if (lastAssistant && lastUser) break;
  }
  return { lastAssistant, lastUser };
}
