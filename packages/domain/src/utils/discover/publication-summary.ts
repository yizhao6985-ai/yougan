import type {
  PublicationSummary,
  PublicationSummaryOverrides,
  PublicationSummaryPreview,
} from "../../models/work/publication-summary.js";
import type { WorkProfile } from "../../models/work/profile.js";
import type { WorkPreview } from "../../models/work/preview.js";
import type { MediaModalityId } from "../../models/content-form/modalities.js";
import {
  DISCOVER_TOPIC_CATEGORIES,
  type DiscoverTopicCategoryId,
} from "../../models/discover/index.js";
import {
  analyzeBlockComposition,
  blockTypesToMediaTypes,
  buildCompositionLabel,
  buildConsumptionHint,
  resolvePublicationCover,
} from "../work/block-composition.js";
import {
  previewExcerpt,
  previewPlainText,
} from "../work/preview.js";
import { getDirectionSummary, parseProfileJson } from "../work/profile.js";
import { normalizeTopicCategory, topicCategoryLabel } from "./publication-metadata.js";

export function buildPublicationSummary(input: {
  preview: WorkPreview;
  workTitle?: string | null;
  profile?: WorkProfile | unknown | null;
}): PublicationSummary {
  const preview = input.preview;
  const blockComposition = analyzeBlockComposition(preview);

  const title =
    preview.title?.trim() ||
    input.workTitle?.trim() ||
    previewPlainText(preview, 40) ||
    "未命名作品";

  const hook =
    preview.hook?.trim() ||
    previewExcerpt(preview, 160) ||
    previewPlainText(preview, 160) ||
    title;

  const cover =
    resolvePublicationCover(preview) ?? { url: "", sourceImageId: null };

  const profile = input.profile ? parseProfileJson(input.profile) : null;
  const contentTopic = profile ? getDirectionSummary(profile) || null : null;
  const topicCategory = normalizeTopicCategory(contentTopic);

  const compositionLabel = buildCompositionLabel(blockComposition);
  const consumptionHint = buildConsumptionHint(blockComposition);
  const mediaTypes = blockTypesToMediaTypes(blockComposition.blockTypes);

  return {
    title,
    hook,
    cover,
    compositionLabel,
    consumptionHint,
    topicCategory,
    blockComposition,
    mediaTypes,
  };
}

function isValidTopicCategory(
  id: string | undefined,
): id is DiscoverTopicCategoryId {
  return Boolean(
    id && DISCOVER_TOPIC_CATEGORIES.some((item) => item.id === id),
  );
}

export function applyPublicationSummaryOverrides(
  summary: PublicationSummary,
  overrides?: PublicationSummaryOverrides | null,
  options?: { preview?: WorkPreview | null },
): PublicationSummary {
  if (!overrides) return summary;

  let cover = summary.cover;
  if (overrides.coverUrl !== undefined) {
    const url = overrides.coverUrl?.trim() ?? "";
    cover = url
      ? { url, sourceImageId: null }
      : { url: "", sourceImageId: null };
  } else if (overrides.coverImageId !== undefined) {
    const imageId = overrides.coverImageId?.trim() ?? "";
    if (!imageId) {
      cover = { url: "", sourceImageId: null };
    } else {
      const resolved = resolvePublicationCover(options?.preview, imageId);
      cover = resolved ?? { url: "", sourceImageId: null };
    }
  }

  return {
    ...summary,
    title: overrides.title?.trim() || summary.title,
    hook: overrides.hook?.trim() || summary.hook,
    cover,
    compositionLabel:
      overrides.compositionLabel?.trim() || summary.compositionLabel,
    topicCategory: isValidTopicCategory(overrides.topicCategory)
      ? overrides.topicCategory
      : summary.topicCategory,
  };
}

export function buildPublicationSummaryPreview(
  summary: PublicationSummary,
): PublicationSummaryPreview {
  return {
    summary,
    labels: {
      topicCategory: topicCategoryLabel(summary.topicCategory),
      compositionLabel: summary.compositionLabel,
      consumptionHint: summary.consumptionHint,
    },
  };
}

export function parseBlockComposition(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return analyzeBlockComposition(null);
  }
  const value = raw as Record<string, unknown>;
  const blockTypes = Array.isArray(value.blockTypes)
    ? value.blockTypes.filter(
        (item): item is MediaModalityId =>
          item === "text" ||
          item === "image" ||
          item === "audio" ||
          item === "video",
      )
    : [];

  return {
    blockTypes,
    textBlockCount:
      typeof value.textBlockCount === "number" ? value.textBlockCount : 0,
    imageCount: typeof value.imageCount === "number" ? value.imageCount : 0,
    audioCount: typeof value.audioCount === "number" ? value.audioCount : 0,
    videoCount: typeof value.videoCount === "number" ? value.videoCount : 0,
    textLength: typeof value.textLength === "number" ? value.textLength : 0,
    totalAudioDurationSec:
      typeof value.totalAudioDurationSec === "number"
        ? value.totalAudioDurationSec
        : null,
    totalVideoDurationSec:
      typeof value.totalVideoDurationSec === "number"
        ? value.totalVideoDurationSec
        : null,
  };
}
