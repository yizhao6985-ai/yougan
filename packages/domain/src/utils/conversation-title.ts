import {
  DEFAULT_CONVERSATION_TITLE_RE,
  MAX_CONVERSATION_TITLE_LENGTH,
} from "../models/conversation/title.js";

export function isDefaultConversationTitle(title: string): boolean {
  return DEFAULT_CONVERSATION_TITLE_RE.test(title.trim());
}

/** 自动标题写入前的规范化 */
export function truncateAtMaxLength(
  text: string,
  maxLength = MAX_CONVERSATION_TITLE_LENGTH,
): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}…`;
}

export function sanitizeAutoConversationTitle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2) return null;
  if (trimmed.length > MAX_CONVERSATION_TITLE_LENGTH) {
    return `${trimmed.slice(0, MAX_CONVERSATION_TITLE_LENGTH)}…`;
  }
  return trimmed;
}
