import {
  MEDIA_MODALITIES,
  type MediaModalityId,
} from "../models/content-form/modalities.js";

export const MEDIA_MODALITY_ORDER: readonly MediaModalityId[] = [
  "text",
  "image",
  "audio",
  "video",
];

const MODALITY_IDS = new Set<string>(MEDIA_MODALITIES.map((item) => item.id));

const MODALITY_LABELS = Object.fromEntries(
  MEDIA_MODALITIES.map((item) => [item.id, item.label]),
) as Record<MediaModalityId, string>;

const LEGACY_MEDIA_MODALITY_MAP: Record<string, MediaModalityId[]> = {
  mixed: ["text", "image"],
  visual: ["image"],
  image: ["image"],
  text: ["text"],
  audio: ["audio"],
  video: ["video"],
};

export function isMediaModalityId(
  value: string | null | undefined,
): value is MediaModalityId {
  return Boolean(value && MODALITY_IDS.has(value));
}

export function sortMediaModalities(
  modalities: Iterable<MediaModalityId>,
): MediaModalityId[] {
  const unique = [...new Set(modalities)].filter(isMediaModalityId);
  return MEDIA_MODALITY_ORDER.filter((id) => unique.includes(id));
}

export function normalizeMediaModalities(
  input: unknown,
  contentFormat?: string | null,
): MediaModalityId[] {
  if (Array.isArray(input)) {
    const normalized = sortMediaModalities(
      input.filter((item): item is MediaModalityId => isMediaModalityId(item)),
    );
    if (normalized.length) return normalized;
  }

  if (typeof input === "string" && input.trim()) {
    const legacy = LEGACY_MEDIA_MODALITY_MAP[input.trim()];
    if (legacy) {
      if (input.trim() === "image" && contentFormat !== "illustration") {
        return ["text", "image"];
      }
      return [...legacy];
    }
    if (isMediaModalityId(input)) return [input];
  }

  return ["text"];
}

export function mediaModalityLabel(id: string | null | undefined) {
  if (!id) return null;
  return MODALITY_LABELS[id as MediaModalityId] ?? id;
}

export function mediaModalitiesLabel(
  modalities: MediaModalityId[] | null | undefined,
) {
  if (!modalities?.length) return null;
  const labels = sortMediaModalities(modalities)
    .map((id) => mediaModalityLabel(id))
    .filter(Boolean);
  return labels.length ? labels.join(" + ") : null;
}

export function inferMediaModalities(input: {
  contentType?: string | null;
  contentFormat?: string | null;
  hasImage?: boolean;
  bodyLength?: number;
}): MediaModalityId[] {
  const contentType = input.contentType?.trim() ?? "";

  if (/音频|播客|音乐|BGM|歌曲|语音/.test(contentType)) return ["audio"];
  if (/视频|口播|短视频|Vlog|vlog|分镜/.test(contentType)) return ["video"];
  if (/绘画|插画|概念图|AI绘画|艺术作品|绘本|海报设计|封面设计/.test(contentType)) {
    return ["image"];
  }
  if (/图文|配图|种草|笔记/.test(contentType)) return ["text", "image"];
  if (/图片|封面|海报/.test(contentType)) return ["image"];
  if (input.contentFormat === "illustration") return ["image"];

  const hasImage = Boolean(input.hasImage);
  const bodyLength = input.bodyLength ?? 0;
  if (hasImage && bodyLength > 100) return ["text", "image"];
  if (hasImage) return ["image"];
  return ["text"];
}

export type ProductionPipelineId = "text" | "video";

/** 按媒介原子组合路由制作 pipeline（当前仅文本/脚本文案） */
export function routeProductionPipeline(
  modalities: MediaModalityId[] | null | undefined,
  _contentFormat?: string | null,
): ProductionPipelineId {
  const set = new Set(sortMediaModalities(modalities ?? []));
  if (set.has("video")) return "video";
  return "text";
}
