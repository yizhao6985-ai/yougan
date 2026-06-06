import { sanitizeAutoConversationTitle } from "./conversation-title.js";

function checkpointMessageContentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (content == null) return "";

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (!part || typeof part !== "object") return "";
        const block = part as { text?: unknown; content?: unknown };
        if (typeof block.text === "string") return block.text;
        if (typeof block.content === "string") return block.content;
        return "";
      })
      .join("");
  }

  if (typeof content === "object") {
    const block = content as { text?: unknown; content?: unknown };
    if (typeof block.text === "string") return block.text;
    if (typeof block.content === "string") return block.content;
  }

  return "";
}

/** LangGraph checkpoint / getState 中的 message 形态（含 SDK 与 LangChain 序列化） */

function messageTypeName(message: Record<string, unknown>): string | null {
  const id = message.id;
  if (Array.isArray(id)) {
    const last = id[id.length - 1];
    return typeof last === "string" ? last : null;
  }
  if (typeof id === "string") return id;
  return null;
}

export function isHumanCheckpointMessage(message: unknown): boolean {
  if (!message || typeof message !== "object") return false;
  const record = message as Record<string, unknown>;
  if (record.type === "human") return true;
  if (record.role === "user") return true;
  const name = messageTypeName(record);
  return name === "HumanMessage" || name === "human";
}

export function countHumanCheckpointMessages(messages: unknown): number {
  if (!Array.isArray(messages)) return 0;
  return messages.filter(isHumanCheckpointMessage).length;
}

export function getFirstHumanCheckpointMessageText(
  messages: unknown,
): string {
  if (!Array.isArray(messages)) return "";
  for (const message of messages) {
    if (!isHumanCheckpointMessage(message)) continue;
    const text = checkpointMessageContentToText(
      (message as { content?: unknown }).content,
    ).trim();
    if (text) return text;
  }
  return "";
}

/** 模型未返回标题时，用用户首句截断至统一上限作为占位标题 */
export function fallbackConversationTitleFromText(text: string): string | null {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  return sanitizeAutoConversationTitle(trimmed);
}
