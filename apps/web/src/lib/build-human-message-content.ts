export type HumanMessageContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export function buildHumanMessageContent(
  text: string,
  imageUrls: string[],
): string | HumanMessageContentPart[] {
  const trimmed = text.trim();
  const urls = imageUrls.filter(Boolean);

  if (urls.length === 0) {
    return trimmed;
  }

  const parts: HumanMessageContentPart[] = [];
  const textPart =
    trimmed ||
    (urls.length === 1
      ? "请结合我附带的参考图片理解并回复。"
      : `请结合我附带的 ${urls.length} 张参考图片理解并回复。`);
  parts.push({ type: "text", text: textPart });

  for (const url of urls) {
    parts.push({ type: "image_url", image_url: { url } });
  }

  return parts;
}
