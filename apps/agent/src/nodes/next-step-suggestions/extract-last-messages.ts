import { messageContentToText } from "../../lib/message-content.js";
import type { AgentStateType } from "../../state.js";

export function extractLastMessages(state: AgentStateType): {
  lastAssistant: string;
  lastUser: string;
} {
  const messages = state.messages ?? [];
  let lastAssistant = "";
  let lastUser = "";
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const type = msg._getType?.() ?? msg.type;
    const text = messageContentToText(msg.content);
    if (!lastAssistant && type === "ai" && text.trim()) {
      lastAssistant = text;
    }
    if (!lastUser && type === "human" && text.trim()) {
      lastUser = text;
    }
    if (lastAssistant && lastUser) break;
  }
  return { lastAssistant, lastUser };
}
