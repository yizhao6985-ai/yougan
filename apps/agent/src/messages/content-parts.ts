/**
 * LangChain 标准 human message 多模态 content part。
 *
 * 图片块统一形态：{ type: "image", source_type: "url" | "base64" | "id", ... }
 * - url:    { url }
 * - base64: { mime_type, data }
 * - id:     { id }
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

export function humanImageFromUrl(url: string): HumanImageUrlContentPart {
  return { type: "image", source_type: "url", url };
}

function isImageContentPart(part: unknown): part is HumanImageContentPart {
  if (!part || typeof part !== "object") return false;
  return (part as { type?: string }).type === "image";
}

/** 从 human message content 提取全部图片块（保留原始 part 结构）。 */
export function extractImagePartsFromContent(
  content: unknown,
): HumanImageContentPart[] {
  if (!Array.isArray(content)) return [];
  return content.filter(isImageContentPart);
}

function imageUrlFromPart(part: HumanImageContentPart): string | undefined {
  if (part.source_type === "url") return part.url;
  return undefined;
}

export function extractImageUrlsFromParts(
  parts: HumanImageContentPart[],
): string[] {
  const urls: string[] = [];
  for (const part of parts) {
    const url = imageUrlFromPart(part);
    if (url) urls.push(url);
  }
  return urls;
}
