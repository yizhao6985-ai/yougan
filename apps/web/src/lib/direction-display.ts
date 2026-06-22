import { MAX_TURN_DIRECTION_LABEL_DISPLAY_LENGTH } from "@yougan/domain";

/** chip 展示用截断（优先展示 prompt，点击仍发送完整 prompt） */
export function truncateDirectionLabelForDisplay(
  label: string,
  maxLength = MAX_TURN_DIRECTION_LABEL_DISPLAY_LENGTH,
): string {
  const trimmed = label.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}…`;
}

/** 延伸方向在 chip 上展示的文案：以用户会发送的 prompt 为准 */
export function resolveTurnDirectionChipText(direction: {
  label: string;
  prompt: string;
}): string {
  const prompt = direction.prompt.trim();
  if (prompt) {
    return truncateDirectionLabelForDisplay(prompt);
  }
  return truncateDirectionLabelForDisplay(direction.label);
}
