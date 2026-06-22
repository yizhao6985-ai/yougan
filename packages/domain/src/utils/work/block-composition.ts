import type { MediaModalityId } from "../../models/content-form/modalities.js";
import type {
  BlockComposition,
  PublicationCover,
} from "../../models/work/publication-summary.js";
import type { WorkPreview } from "../../models/work/preview.js";
import { previewImages, previewPlainText } from "./preview.js";
import { sortMediaModalities } from "../media-modalities.js";

type PublicationCoverOption = {
  imageId: string;
  url: string;
  label: string;
};

const MEDIA_TYPE_ORDER: MediaModalityId[] = [
  "text",
  "image",
  "audio",
  "video",
];

function emptyComposition(): BlockComposition {
  return {
    blockTypes: [],
    textBlockCount: 0,
    imageCount: 0,
    audioCount: 0,
    videoCount: 0,
    textLength: 0,
    totalAudioDurationSec: null,
    totalVideoDurationSec: null,
  };
}

function uniqueMediaTypes(types: MediaModalityId[]): MediaModalityId[] {
  const seen = new Set<MediaModalityId>();
  for (const type of types) {
    seen.add(type);
  }
  return MEDIA_TYPE_ORDER.filter((type) => seen.has(type));
}

export function analyzeBlockComposition(
  preview: WorkPreview | null | undefined,
): BlockComposition {
  if (!preview?.content) return emptyComposition();

  const textLength = previewPlainText(preview).length;
  const textBlockCount = textLength > 0 ? 1 : 0;
  const imageCount = previewImages(preview).length;

  const blockTypes = uniqueMediaTypes([
    ...(textBlockCount > 0 ? (["text"] as const) : []),
    ...(imageCount > 0 ? (["image"] as const) : []),
  ]);

  return {
    blockTypes,
    textBlockCount,
    imageCount,
    audioCount: 0,
    videoCount: 0,
    textLength,
    totalAudioDurationSec: null,
    totalVideoDurationSec: null,
  };
}

function formatReadingMinutes(textLength: number): string {
  const minutes = Math.max(1, Math.round(textLength / 400));
  return `约 ${minutes} 分钟阅读`;
}

export function buildCompositionLabel(
  composition: BlockComposition,
): string {
  const parts: string[] = [];

  if (composition.textBlockCount > 0) {
    parts.push(
      composition.textBlockCount > 1
        ? `${composition.textBlockCount} 段文字`
        : "文字",
    );
  }
  if (composition.imageCount > 0) {
    parts.push(
      composition.imageCount > 1
        ? `${composition.imageCount} 张图`
        : "配图",
    );
  }
  if (composition.audioCount > 0) {
    parts.push(
      composition.audioCount > 1
        ? `${composition.audioCount} 段音频`
        : "音频",
    );
  }
  if (composition.videoCount > 0) {
    parts.push(
      composition.videoCount > 1
        ? `${composition.videoCount} 段视频`
        : "视频",
    );
  }

  if (!parts.length) return "混合内容";
  if (parts.length === 1) return parts[0]!;
  return parts.join(" · ");
}

export function buildConsumptionHint(
  composition: BlockComposition,
): string | null {
  const hints: string[] = [];

  if (composition.textLength > 0) {
    hints.push(formatReadingMinutes(composition.textLength));
  }
  if (composition.imageCount > 0 && composition.textLength === 0) {
    hints.push(
      composition.imageCount > 1
        ? `${composition.imageCount} 张图`
        : "图片",
    );
  }

  return hints.length ? hints.join(" · ") : null;
}

export function blockTypesToMediaTypes(
  blockTypes: MediaModalityId[],
): ReturnType<typeof sortMediaModalities> {
  return sortMediaModalities(blockTypes);
}

function coverLabelForImage(
  image: { alt?: string | null },
  index: number,
): string {
  return image.alt?.trim() || `图片 ${index + 1}`;
}

export function listPublicationCoverOptions(
  preview: WorkPreview | null | undefined,
): PublicationCoverOption[] {
  return previewImages(preview).map((image, index) => ({
    imageId: image.id,
    url: image.url.trim(),
    label: coverLabelForImage(image, index),
  }));
}

export function resolvePublicationCover(
  preview: WorkPreview | null | undefined,
  coverImageId?: string | null,
): PublicationCover | null {
  const options = listPublicationCoverOptions(preview);
  if (!options.length) return null;

  const preferred = coverImageId
    ? options.find((item) => item.imageId === coverImageId)
    : undefined;

  const chosen = preferred ?? options[0]!;
  return {
    url: chosen.url,
    sourceImageId: chosen.imageId,
  };
}

export function pickDefaultCoverImageId(
  preview: WorkPreview | null | undefined,
): string | null {
  return resolvePublicationCover(preview)?.sourceImageId ?? null;
}
