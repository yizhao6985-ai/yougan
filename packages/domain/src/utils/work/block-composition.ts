import type {
  BlockComposition,
  PublicationCover,
} from "../../models/work/publication-summary.js";
import type { PreviewBlock, PreviewBlockType } from "../../models/work/preview.js";
import { sortMediaModalities } from "../media-modalities.js";

type PublicationCoverOption = {
  blockId: string;
  url: string;
  label: string;
};

const BLOCK_TYPE_ORDER: PreviewBlockType[] = [
  "text",
  "image",
  "audio",
  "video",
];

function uniqueBlockTypes(blocks: PreviewBlock[]): PreviewBlockType[] {
  const seen = new Set<PreviewBlockType>();
  for (const block of blocks) {
    seen.add(block.type);
  }
  return BLOCK_TYPE_ORDER.filter((type) => seen.has(type));
}

export function analyzeBlockComposition(
  blocks: PreviewBlock[] | null | undefined,
): BlockComposition {
  const list = blocks ?? [];
  let textBlockCount = 0;
  let imageCount = 0;
  let audioCount = 0;
  let videoCount = 0;
  let textLength = 0;
  let totalAudioDurationSec = 0;
  let audioDurationKnown = false;
  let totalVideoDurationSec = 0;
  let videoDurationKnown = false;

  for (const block of list) {
    switch (block.type) {
      case "text":
        textBlockCount += 1;
        textLength += block.markdown.trim().length;
        break;
      case "image":
        imageCount += 1;
        break;
      case "audio":
        audioCount += 1;
        if (typeof block.durationSec === "number" && block.durationSec > 0) {
          totalAudioDurationSec += block.durationSec;
          audioDurationKnown = true;
        }
        break;
      case "video":
        videoCount += 1;
        if (typeof block.durationSec === "number" && block.durationSec > 0) {
          totalVideoDurationSec += block.durationSec;
          videoDurationKnown = true;
        }
        break;
      default:
        break;
    }
  }

  return {
    blockTypes: uniqueBlockTypes(list),
    textBlockCount,
    imageCount,
    audioCount,
    videoCount,
    textLength,
    totalAudioDurationSec: audioDurationKnown ? totalAudioDurationSec : null,
    totalVideoDurationSec: videoDurationKnown ? totalVideoDurationSec : null,
  };
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))} 秒`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  if (remainder === 0) return `${minutes} 分钟`;
  return `${minutes} 分 ${remainder} 秒`;
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
  if (composition.totalVideoDurationSec != null) {
    hints.push(formatDuration(composition.totalVideoDurationSec));
  } else if (composition.totalAudioDurationSec != null) {
    hints.push(formatDuration(composition.totalAudioDurationSec));
  }

  return hints.length ? hints.join(" · ") : null;
}

export function blockTypesToMediaTypes(
  blockTypes: PreviewBlockType[],
): ReturnType<typeof sortMediaModalities> {
  return sortMediaModalities(blockTypes as Parameters<typeof sortMediaModalities>[0]);
}

function coverLabelForBlock(block: PreviewBlock, index: number): string {
  switch (block.type) {
    case "image":
      return `图片 ${index + 1}`;
    case "video":
      return block.title?.trim() || `视频 ${index + 1}`;
    default:
      return `片段 ${index + 1}`;
  }
}

export function listPublicationCoverOptions(
  blocks: PreviewBlock[] | null | undefined,
): PublicationCoverOption[] {
  const options: PublicationCoverOption[] = [];

  blocks?.forEach((block, index) => {
    if (block.type === "image" && block.url.trim()) {
      options.push({
        blockId: block.id,
        url: block.url.trim(),
        label: coverLabelForBlock(block, index),
      });
      return;
    }
    if (block.type === "video") {
      const url = block.posterUrl?.trim() || block.url.trim();
      if (!url) return;
      options.push({
        blockId: block.id,
        url,
        label: coverLabelForBlock(block, index),
      });
    }
  });

  return options;
}

export function resolvePublicationCover(
  blocks: PreviewBlock[] | null | undefined,
  coverBlockId?: string | null,
): PublicationCover | null {
  const options = listPublicationCoverOptions(blocks);
  if (!options.length) return null;

  const preferred = coverBlockId
    ? options.find((item) => item.blockId === coverBlockId)
    : undefined;

  const chosen = preferred ?? options[0]!;
  return {
    url: chosen.url,
    sourceBlockId: chosen.blockId,
  };
}

export function pickDefaultCoverBlockId(
  blocks: PreviewBlock[] | null | undefined,
): string | null {
  return resolvePublicationCover(blocks)?.sourceBlockId ?? null;
}
