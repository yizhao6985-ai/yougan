import { MAX_NEXT_STEP_SUGGESTION_DISPLAY_LENGTH } from "@yougan/domain";

/** 建议气泡展示用截断（点击仍发送完整 message） */
export function truncateSuggestionForDisplay(
  message: string,
  maxLength = MAX_NEXT_STEP_SUGGESTION_DISPLAY_LENGTH,
): string {
  const trimmed = message.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}…`;
}
