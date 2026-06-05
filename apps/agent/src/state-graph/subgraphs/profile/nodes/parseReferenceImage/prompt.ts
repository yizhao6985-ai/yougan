export function buildParseReferenceImagePrompt(hint?: string | null): string {
  return `描述这张参考图的风格、构图、色调，用于后续创作参考。${hint ?? ""}`;
}
