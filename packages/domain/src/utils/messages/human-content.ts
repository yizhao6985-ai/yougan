import type {
  HumanAssetContentPart,
  HumanAttachmentAsset,
  HumanImageUrlContentPart,
  HumanMessageContentPart,
} from "../../models/messages/human-content.js";

/** LLM 视觉调用边界：将 URL 转为 LangChain image part（不用于 human message 存储）。 */
export function humanImageFromUrl(url: string): HumanImageUrlContentPart {
  return { type: "image", source_type: "url", url };
}

export function humanAssetContentPart(
  input: HumanAttachmentAsset,
): HumanAssetContentPart {
  return {
    url: input.url,
    mime_type: input.mime_type,
    original_name: input.original_name ?? null,
  };
}

export function isHumanAssetContentPart(
  part: unknown,
): part is HumanAssetContentPart {
  if (!part || typeof part !== "object") return false;
  const value = part as Record<string, unknown>;
  if (value.type === "text") return false;
  return typeof value.url === "string" && typeof value.mime_type === "string";
}

export function extractAssetPartsFromContent(
  content: unknown,
): HumanAssetContentPart[] {
  if (!Array.isArray(content)) return [];
  return content.filter(isHumanAssetContentPart);
}

/** 从 human 消息 content 提取全部附件。 */
export function extractAttachmentAssetsFromContent(
  content: unknown,
): HumanAttachmentAsset[] {
  return extractAssetPartsFromContent(content).map((part) => ({
    url: part.url,
    mime_type: part.mime_type,
    original_name: part.original_name,
  }));
}

export function defaultAttachmentPromptText(count: number): string {
  if (count === 1) return "请结合我附带的参考素材理解并回复。";
  return `请结合我附带的 ${count} 份参考素材理解并回复。`;
}

/** 仅附件、无用户输入时写入 human 消息的占位文案。 */
export function isDefaultAttachmentPromptText(
  text: string,
  attachmentCount: number,
): boolean {
  const trimmed = text.trim();
  if (!trimmed || attachmentCount === 0) return false;
  return trimmed === defaultAttachmentPromptText(attachmentCount);
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

  const parts: HumanMessageContentPart[] = ready.map((item) =>
    humanAssetContentPart(item),
  );

  const textPart = trimmed || defaultAttachmentPromptText(parts.length);
  return [{ type: "text", text: textPart }, ...parts];
}
