/** 系统占位对话标题，如「对话 1」「对话 2」 */
export const DEFAULT_CONVERSATION_TITLE_RE = /^对话\s*\d+$/;

/** 自动对话标题统一上限（侧栏、schema、sanitize 共用） */
export const MAX_CONVERSATION_TITLE_LENGTH = 24;

export function isDefaultConversationTitle(title: string): boolean {
  return DEFAULT_CONVERSATION_TITLE_RE.test(title.trim());
}

/** 自动标题写入前的规范化 */
export function sanitizeAutoConversationTitle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2) return null;
  if (trimmed.length > MAX_CONVERSATION_TITLE_LENGTH) {
    return `${trimmed.slice(0, MAX_CONVERSATION_TITLE_LENGTH)}…`;
  }
  return trimmed;
}
