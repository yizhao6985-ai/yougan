/** 过滤无效 excerpt / detail 占位 */
export function sanitizeBriefingExcerpt(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
    return null;
  }
  return trimmed;
}

export const TURN_BRIEFING_AI_MESSAGE_KIND = "turn_briefing" as const;

type MessageLike = {
  type?: string;
  additional_kwargs?: Record<string, unknown>;
};

export function isTurnBriefingAiMessage(message: MessageLike): boolean {
  if (message.type !== "ai") return false;
  const kwargs = message.additional_kwargs;
  if (!kwargs || typeof kwargs !== "object") return false;
  return kwargs.yougan_message_kind === TURN_BRIEFING_AI_MESSAGE_KIND;
}

export function parseTurnBriefingExcerptFromMessage(
  message: MessageLike,
): string | null {
  const kwargs = message.additional_kwargs;
  if (!kwargs || typeof kwargs !== "object") return null;
  return sanitizeBriefingExcerpt(kwargs.turn_briefing_excerpt);
}
