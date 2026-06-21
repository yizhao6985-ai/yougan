import type {
  HumanAssetContentPart,
  HumanAttachmentAsset,
  HumanMessageContentPart,
  HumanPreviewSelection,
  HumanPreviewSelectionPart,
} from "../../models/messages/human-content.js";
import { HUMAN_PREVIEW_SELECTION_PART_TYPE } from "../../models/messages/human-content.js";

export function humanAssetContentPart(
  input: HumanAttachmentAsset,
): HumanAssetContentPart {
  return {
    url: input.url,
    mime_type: input.mime_type,
    original_name: input.original_name ?? null,
  };
}

export function humanPreviewSelectionContentPart(
  input: HumanPreviewSelection,
): HumanPreviewSelectionPart {
  return {
    type: HUMAN_PREVIEW_SELECTION_PART_TYPE,
    blockId: input.blockId,
    quote: input.quote,
  };
}

export function isHumanAssetContentPart(
  part: unknown,
): part is HumanAssetContentPart {
  if (!part || typeof part !== "object") return false;
  const value = part as Record<string, unknown>;
  if (value.type === "text" || value.type === HUMAN_PREVIEW_SELECTION_PART_TYPE) {
    return false;
  }
  return typeof value.url === "string" && typeof value.mime_type === "string";
}

export function isHumanPreviewSelectionPart(
  part: unknown,
): part is HumanPreviewSelectionPart {
  return (
    part != null &&
    typeof part === "object" &&
    "type" in part &&
    (part as { type?: unknown }).type === HUMAN_PREVIEW_SELECTION_PART_TYPE &&
    typeof (part as HumanPreviewSelectionPart).blockId === "string" &&
    typeof (part as HumanPreviewSelectionPart).quote === "string"
  );
}

export function extractPreviewSelectionPartsFromContent(
  content: unknown,
): HumanPreviewSelectionPart[] {
  if (!Array.isArray(content)) return [];
  return content.filter(isHumanPreviewSelectionPart);
}

export function extractPreviewSelectionsFromContent(
  content: unknown,
): HumanPreviewSelection[] {
  return extractPreviewSelectionPartsFromContent(content).map((part) => ({
    blockId: part.blockId,
    quote: part.quote,
  }));
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

export function previewSelectionLabel(quote: string, maxLength = 48): string {
  const trimmed = quote.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}…`;
}

export function previewSelectionsSummary(
  selections: HumanPreviewSelection[],
): string {
  if (selections.length === 0) return "";
  if (selections.length === 1) {
    return `[引用成稿片段：「${previewSelectionLabel(selections[0]!.quote, 120)}」]`;
  }
  return `[引用 ${selections.length} 处成稿片段]`;
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
  previewSelections: HumanPreviewSelection[] = [],
): string | HumanMessageContentPart[] {
  const trimmed = text.trim();
  const readyAttachments = attachments.filter((item) => item.url?.trim());
  const readySelections = previewSelections.filter(
    (item) => item.blockId.trim() && item.quote.trim(),
  );

  if (readyAttachments.length === 0 && readySelections.length === 0) {
    return trimmed;
  }

  const textPart =
    trimmed ||
    (readyAttachments.length > 0
      ? defaultAttachmentPromptText(readyAttachments.length)
      : "");

  return [
    ...readySelections.map((item) => humanPreviewSelectionContentPart(item)),
    { type: "text", text: textPart },
    ...readyAttachments.map((item) => humanAssetContentPart(item)),
  ];
}
