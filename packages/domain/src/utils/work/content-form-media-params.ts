import type { ContentFormatId } from "../../models/content-form/formats.js";
import type { MediaModalityId } from "../../models/content-form/modalities.js";
import type {
  AudioMediaParams,
  ContentFormMediaParams,
  ImageMediaParams,
  TextMediaParams,
  VideoMediaParams,
} from "../../models/work/profile.js";
import { inferMediaModalities, sortMediaModalities } from "../media-modalities.js";
import { normalizeProfileAspectRatio, type AspectRatioContext } from "../aspect-ratio.js";

export const EMPTY_CONTENT_FORM_MEDIA_PARAMS: ContentFormMediaParams = {};

function parseTextMediaParams(raw: unknown): TextMediaParams | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  const wordCountRaw = value.word_count;
  let word_count: TextMediaParams["word_count"];
  if (wordCountRaw && typeof wordCountRaw === "object") {
    const wc = wordCountRaw as Record<string, unknown>;
    word_count = {
      min: typeof wc.min === "number" ? wc.min : undefined,
      max: typeof wc.max === "number" ? wc.max : undefined,
    };
  }
  const emoji = value.emoji_level;
  const emoji_level =
    emoji === "none" || emoji === "light" || emoji === "heavy"
      ? emoji
      : undefined;
  if (!word_count && !emoji_level) return undefined;
  return { word_count, emoji_level };
}

function parseImageMediaParams(raw: unknown): ImageMediaParams | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  const aspect_ratio =
    typeof value.aspect_ratio === "string" ? value.aspect_ratio : undefined;
  if (!aspect_ratio) return undefined;
  return { aspect_ratio };
}

function parseVideoMediaParams(raw: unknown): VideoMediaParams | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  const duration_sec =
    typeof value.duration_sec === "number" ? value.duration_sec : undefined;
  const aspect_ratio =
    typeof value.aspect_ratio === "string" ? value.aspect_ratio : undefined;
  const pacing = typeof value.pacing === "string" ? value.pacing : undefined;
  if (!duration_sec && !aspect_ratio && !pacing) return undefined;
  return { duration_sec, aspect_ratio, pacing };
}

function parseAudioMediaParams(raw: unknown): AudioMediaParams | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  const duration_sec =
    typeof value.duration_sec === "number" ? value.duration_sec : undefined;
  if (!duration_sec) return undefined;
  return { duration_sec };
}

export function parseContentFormMediaParams(raw: unknown): ContentFormMediaParams {
  if (!raw || typeof raw !== "object") return { ...EMPTY_CONTENT_FORM_MEDIA_PARAMS };
  const value = raw as Record<string, unknown>;
  const text = parseTextMediaParams(value.text);
  const image = parseImageMediaParams(value.image);
  const video = parseVideoMediaParams(value.video);
  const audio = parseAudioMediaParams(value.audio);
  return {
    ...(text ? { text } : {}),
    ...(image ? { image } : {}),
    ...(video ? { video } : {}),
    ...(audio ? { audio } : {}),
  };
}

export function mergeContentFormMediaParams(
  base: ContentFormMediaParams,
  patch: ContentFormMediaParams,
): ContentFormMediaParams {
  return {
    text: patch.text ? { ...base.text, ...patch.text } : base.text,
    image: patch.image ? { ...base.image, ...patch.image } : base.image,
    video: patch.video ? { ...base.video, ...patch.video } : base.video,
    audio: patch.audio ? { ...base.audio, ...patch.audio } : base.audio,
  };
}

export function defaultMediaParamsForFormat(
  format: ContentFormatId,
  modalities: MediaModalityId[],
): ContentFormMediaParams {
  const set = new Set(sortMediaModalities(modalities));
  const params: ContentFormMediaParams = {};

  if (set.has("text") || format === "note" || format === "article" || format === "blog") {
    params.text = {};
  }
  if (set.has("image") || format === "illustration" || format === "note") {
    params.image = {};
  }
  if (set.has("video") || format === "short_video" || format === "video_script") {
    params.video = {};
  }
  if (set.has("audio") || format === "podcast" || format === "music") {
    params.audio = {};
  }

  if (format === "illustration" && !params.image) params.image = {};
  if (format === "short_video" && !params.video) params.video = {};
  if (format === "podcast" || format === "music") {
    if (!params.audio) params.audio = {};
  }

  return params;
}

export function inferFormatFromModalities(
  modalities: MediaModalityId[],
  current: ContentFormatId | null,
): ContentFormatId {
  if (current) return current;
  const set = new Set(modalities);
  if (set.has("video")) return "short_video";
  if (set.has("audio")) return "podcast";
  if (set.has("image") && !set.has("text")) return "illustration";
  if (set.has("image") && set.has("text")) return "note";
  if (set.has("text")) return "short_post";
  return "short_post";
}

export function syncModalitiesWithFormat(
  format: ContentFormatId | null,
  modalities: MediaModalityId[],
): MediaModalityId[] {
  if (modalities.length) return sortMediaModalities(modalities);
  return inferMediaModalities({ contentFormat: format });
}

export function imageAspectRatioFromMediaParams(
  mediaParams: ContentFormMediaParams,
  ctx: AspectRatioContext,
): string | undefined {
  const raw = mediaParams.image?.aspect_ratio?.trim();
  if (!raw) return undefined;
  return normalizeProfileAspectRatio(raw, ctx) ?? raw;
}

export function videoAspectRatioFromMediaParams(
  mediaParams: ContentFormMediaParams,
  ctx: AspectRatioContext,
): string | undefined {
  const raw = mediaParams.video?.aspect_ratio?.trim();
  if (!raw) return undefined;
  return normalizeProfileAspectRatio(raw, ctx) ?? raw;
}
