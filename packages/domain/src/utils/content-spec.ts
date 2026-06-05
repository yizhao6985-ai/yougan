import {
  CONTENT_FORMATS,
  type ContentFormatId,
  type MediaModalityId,
} from "../models/content/catalog.js";
import type { WorkProfile } from "../models/work/profile.js";
import {
  inferMediaModalities,
  mediaModalitiesLabel,
  mediaModalityLabel,
  normalizeMediaModalities,
  routeProductionPipeline,
  sortMediaModalities,
  type ProductionPipelineId,
} from "./media-modalities.js";

const FORMAT_IDS = new Set<string>(CONTENT_FORMATS.map((item) => item.id));

const FORMAT_LABELS = Object.fromEntries(
  CONTENT_FORMATS.map((item) => [item.id, item.label]),
) as Record<ContentFormatId, string>;

export type FlatContentSpec = {
  platform?: string | null;
  content_topic?: string | null;
  content_type?: string | null;
  content_format?: string | null;
  media_modalities?: MediaModalityId[];
};

export { type ProductionPipelineId, routeProductionPipeline };

export function flattenWorkProfile(profile: WorkProfile): FlatContentSpec {
  return {
    platform: profile.spec.platform,
    content_topic: profile.spec.content_topic,
    content_type: profile.spec.content_type,
    content_format: profile.spec.content_format,
    media_modalities: profile.spec.media_modalities,
  };
}

export function contentFormatLabel(id: string | null | undefined) {
  if (!id) return null;
  return FORMAT_LABELS[id as ContentFormatId] ?? id;
}

export {
  mediaModalityLabel,
  mediaModalitiesLabel,
  normalizeMediaModalities,
  sortMediaModalities,
};

function normalizeContentFormatFromType(contentType: string | null | undefined) {
  const value = contentType?.trim();
  if (!value) return null;

  if (/绘画|插画|概念图|AI绘画|艺术作品|绘本|海报设计|封面设计/.test(value))
    return "illustration";
  if (/小说|短篇|连载|言情|科幻小说/.test(value)) return "novel";
  if (/博客|Blog|blog/.test(value)) return "blog";
  if (/笔记|种草|图文笔记/.test(value)) return "note";
  if (/短帖|动态|微博|快讯/.test(value)) return "short_post";
  if (/长文|文章|专栏|深度|公众号/.test(value)) return "article";
  if (/播客|Podcast|podcast/.test(value)) return "podcast";
  if (/音乐|BGM|歌曲|音频/.test(value)) return "music";
  if (/短视频|Vlog|vlog/.test(value)) return "short_video";
  if (/脚本|口播|分镜|视频/.test(value)) return "video_script";

  return null;
}

function inferContentFormat(spec: FlatContentSpec) {
  const fromType = normalizeContentFormatFromType(spec.content_type);
  if (fromType) return fromType as ContentFormatId;

  const modalities = spec.media_modalities ?? [];
  if (
    modalities.length === 1 &&
    modalities[0] === "image" &&
    !spec.content_format
  ) {
    return "illustration";
  }

  const platform = spec.platform ?? "yougan";
  switch (platform) {
    case "xiaohongshu":
      return "note";
    case "weibo":
      return "short_post";
    case "wechat":
      return "article";
    case "douyin":
    case "kuaishou":
      return "short_video";
    case "bilibili":
      return "video_script";
    default:
      return "short_post";
  }
}

export function isValidContentFormat(
  value: string | null | undefined,
): value is ContentFormatId {
  return Boolean(value && FORMAT_IDS.has(value));
}

/** 补齐缺失或无效的 content_format / media_modalities */
export function resolveContentSpec(spec: FlatContentSpec): FlatContentSpec {
  const content_format = isValidContentFormat(spec.content_format)
    ? spec.content_format
    : inferContentFormat(spec);
  const media_modalities = spec.media_modalities?.length
    ? sortMediaModalities(spec.media_modalities)
    : inferMediaModalities({
        contentType: spec.content_type,
        contentFormat: content_format,
      });

  if (
    spec.content_format === content_format &&
    JSON.stringify(spec.media_modalities ?? []) ===
      JSON.stringify(media_modalities)
  ) {
    return spec;
  }

  return {
    ...spec,
    content_format,
    media_modalities,
  };
}

export function resolveContentSpecFromProfile(profile: WorkProfile): FlatContentSpec {
  return resolveContentSpec(flattenWorkProfile(profile));
}

export function contentSpecSummary(spec: FlatContentSpec) {
  const resolved = resolveContentSpec(spec);
  const format = contentFormatLabel(resolved.content_format);
  const modalities = mediaModalitiesLabel(resolved.media_modalities);
  const parts = [
    format ? `体裁：${format}` : null,
    modalities ? `形式：${modalities}` : null,
    resolved.content_type ? `类型描述：${resolved.content_type}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join("；") : "尚未确定体裁与形式";
}
