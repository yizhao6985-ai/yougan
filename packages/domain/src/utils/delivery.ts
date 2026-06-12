import {
  CONTENT_FORMATS,
  type ContentFormatId,
  type MediaModalityId,
} from "../models/taxonomy/content.js";
import type {
  DiscoverPlatformId,
  DiscoverTopicCategoryId,
} from "../models/taxonomy/discover.js";
import type {
  AudioFormatParams,
  FormatParams,
  IllustrationFormatParams,
  ProfileDelivery,
  TextFormatParams,
  VideoFormatParams,
} from "../models/work/profile.js";
import {
  inferMediaModalities,
  sortMediaModalities,
} from "./media-modalities.js";

const FORMAT_IDS = new Set<string>(CONTENT_FORMATS.map((item) => item.id));

const PLATFORM_FORMAT_FALLBACK: Record<string, ContentFormatId> = {
  xiaohongshu: "note",
  weibo: "short_post",
  wechat: "article",
  douyin: "short_video",
  kuaishou: "short_video",
  bilibili: "video_script",
  yougan: "short_post",
};

export function isValidContentFormat(
  value: string | null | undefined,
): value is ContentFormatId {
  return Boolean(value && FORMAT_IDS.has(value));
}

export function defaultParamsForFormat(format: ContentFormatId): FormatParams {
  switch (format) {
    case "illustration":
      return { kind: "illustration" };
    case "short_video":
      return { kind: "video" };
    case "podcast":
    case "music":
      return { kind: "audio" };
    default:
      return { kind: "text" };
  }
}

function inferFormatFromPlatform(
  platform: DiscoverPlatformId | string | null | undefined,
): ContentFormatId {
  const key = platform?.trim() || "yougan";
  return PLATFORM_FORMAT_FALLBACK[key] ?? "short_post";
}

function normalizeCategory(
  value: string | null | undefined,
): DiscoverTopicCategoryId | null {
  if (!value?.trim()) return null;
  const id = value.trim();
  const valid = [
    "life",
    "career",
    "tech",
    "culture",
    "story",
    "knowledge",
    "brand",
    "general",
  ] as const;
  return valid.includes(id as (typeof valid)[number])
    ? (id as DiscoverTopicCategoryId)
    : null;
}

/** 补齐缺失或无效的 format / modalities（仅制作/发布等运行时推断，不写入 profile） */
export function resolveDelivery(delivery: ProfileDelivery): ResolvedDelivery {
  const format = isValidContentFormat(delivery.format)
    ? delivery.format
    : inferFormatFromPlatform(delivery.platform);
  const modalities = delivery.modalities?.length
    ? sortMediaModalities(delivery.modalities)
    : inferMediaModalities({ contentFormat: format });

  const category = normalizeCategory(delivery.category);

  if (
    delivery.format === format &&
    JSON.stringify(delivery.modalities ?? []) === JSON.stringify(modalities) &&
    delivery.category === category
  ) {
    return delivery;
  }

  return {
    ...delivery,
    format,
    modalities,
    category,
  };
}

export function parseFormatParams(
  raw: unknown,
  format: ContentFormatId | null,
): FormatParams {
  if (!raw || typeof raw !== "object") {
    return format ? defaultParamsForFormat(format) : { kind: "text" };
  }
  const value = raw as Record<string, unknown>;
  const kind =
    typeof value.kind === "string"
      ? value.kind
      : format
        ? defaultParamsForFormat(format).kind
        : "text";

  if (kind === "illustration") {
    return {
      kind: "illustration",
      aspect_ratio:
        typeof value.aspect_ratio === "string" ? value.aspect_ratio : undefined,
      image_count:
        typeof value.image_count === "number" ? value.image_count : undefined,
      negative_hints: Array.isArray(value.negative_hints)
        ? value.negative_hints.filter((item): item is string => typeof item === "string")
        : undefined,
    } satisfies IllustrationFormatParams;
  }

  if (kind === "video") {
    return {
      kind: "video",
      duration_sec:
        typeof value.duration_sec === "number" ? value.duration_sec : undefined,
      aspect_ratio:
        typeof value.aspect_ratio === "string" ? value.aspect_ratio : undefined,
      pacing: typeof value.pacing === "string" ? value.pacing : undefined,
    } satisfies VideoFormatParams;
  }

  if (kind === "audio") {
    return {
      kind: "audio",
      duration_sec:
        typeof value.duration_sec === "number" ? value.duration_sec : undefined,
      segment_count:
        typeof value.segment_count === "number" ? value.segment_count : undefined,
    } satisfies AudioFormatParams;
  }

  const wordCountRaw = value.word_count;
  let word_count: TextFormatParams["word_count"];
  if (wordCountRaw && typeof wordCountRaw === "object") {
    const wc = wordCountRaw as Record<string, unknown>;
    word_count = {
      min: typeof wc.min === "number" ? wc.min : undefined,
      max: typeof wc.max === "number" ? wc.max : undefined,
    };
  }

  const emoji = value.emoji_level;
  const emoji_level =
    emoji === "none" || emoji === "light" || emoji === "heavy" ? emoji : undefined;

  return {
    kind: "text",
    word_count,
    emoji_level,
  } satisfies TextFormatParams;
}

export type ResolvedDelivery = ProfileDelivery & {
  modalities: MediaModalityId[];
  format: ContentFormatId;
};
