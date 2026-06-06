/**
 * LangChain 标准 human message 多模态 content part（与 agent/messages/content-parts 对齐）。
 *
 * 图片块：{ type: "image", source_type: "url" | "base64" | "id", ... }
 */

export type HumanTextContentPart = { type: "text"; text: string };

export type HumanImageUrlContentPart = {
  type: "image";
  source_type: "url";
  url: string;
};

export type HumanImageBase64ContentPart = {
  type: "image";
  source_type: "base64";
  mime_type: string;
  data: string;
};

export type HumanImageIdContentPart = {
  type: "image";
  source_type: "id";
  id: string;
};

export type HumanImageContentPart =
  | HumanImageUrlContentPart
  | HumanImageBase64ContentPart
  | HumanImageIdContentPart;

export type HumanMessageContentPart =
  | HumanTextContentPart
  | HumanImageContentPart;

function humanImageFromUrl(url: string): HumanImageUrlContentPart {
  return { type: "image", source_type: "url", url };
}

export function buildHumanMessageContent(
  text: string,
  imageUrls: string[],
): string | HumanMessageContentPart[] {
  const trimmed = text.trim();
  const urls = imageUrls.filter(Boolean);

  if (urls.length === 0) {
    return trimmed;
  }

  const images = urls.map(humanImageFromUrl);
  const textPart =
    trimmed ||
    (images.length === 1
      ? "请结合我附带的参考图片理解并回复。"
      : `请结合我附带的 ${images.length} 张参考图片理解并回复。`);

  return [{ type: "text", text: textPart }, ...images];
}
