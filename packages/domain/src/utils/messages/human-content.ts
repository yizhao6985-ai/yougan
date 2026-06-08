import type {
  HumanAssetUrlContentPart,
  HumanAttachmentAsset,
  HumanImageContentPart,
  HumanImageUrlContentPart,
  HumanMessageContentPart,
} from "../../models/messages/human-content.js";
import { inferMediaKind } from "../asset.js";

export function humanImageFromUrl(url: string): HumanImageUrlContentPart {
  return { type: "image", source_type: "url", url };
}

export function humanAssetFromUrl(input: HumanAttachmentAsset): HumanAssetUrlContentPart {
  return {
    type: "asset",
    source_type: "url",
    url: input.url,
    mime_type: input.mime_type,
    original_name: input.original_name ?? null,
  };
}

function isImageContentPart(part: unknown): part is HumanImageContentPart {
  if (!part || typeof part !== "object") return false;
  return (part as { type?: string }).type === "image";
}

function isAssetContentPart(part: unknown): part is HumanAssetUrlContentPart {
  if (!part || typeof part !== "object") return false;
  const value = part as HumanAssetUrlContentPart;
  return value.type === "asset" && value.source_type === "url";
}

/** 从 human message content 提取全部图片块（保留原始 part 结构）。 */
export function extractImagePartsFromContent(
  content: unknown,
): HumanImageContentPart[] {
  if (!Array.isArray(content)) return [];
  return content.filter(isImageContentPart);
}

export function extractAssetPartsFromContent(
  content: unknown,
): HumanAssetUrlContentPart[] {
  if (!Array.isArray(content)) return [];
  return content.filter(isAssetContentPart);
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

/** 从 human 消息 content 提取全部附件（图片 + 音视频等 asset part）。 */
export function extractAttachmentAssetsFromContent(
  content: unknown,
): HumanAttachmentAsset[] {
  if (!Array.isArray(content)) return [];

  const assets: HumanAttachmentAsset[] = [];

  for (const part of content) {
    if (isImageContentPart(part) && part.source_type === "url") {
      assets.push({
        url: part.url,
        mime_type: "image/*",
      });
      continue;
    }
    if (isAssetContentPart(part)) {
      assets.push({
        url: part.url,
        mime_type: part.mime_type,
        original_name: part.original_name,
      });
    }
  }

  return assets;
}

function defaultAttachmentText(count: number): string {
  if (count === 1) return "请结合我附带的参考素材理解并回复。";
  return `请结合我附带的 ${count} 份参考素材理解并回复。`;
}

export function buildHumanMessageContent(
  text: string,
  attachments: HumanAttachmentAsset[] = [],
): string | HumanMessageContentPart[] {
  const trimmed = text.trim();
  const ready = attachments.filter((item) => item.url?.trim());

  if (ready.length === 0) {
    return trimmed;
  }

  const parts: HumanMessageContentPart[] = ready.map((item) => {
    const kind = inferMediaKind(item.mime_type);
    return kind === "image"
      ? humanImageFromUrl(item.url)
      : humanAssetFromUrl(item);
  });

  const textPart = trimmed || defaultAttachmentText(parts.length);
  return [{ type: "text", text: textPart }, ...parts];
}
