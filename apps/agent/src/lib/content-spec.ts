/**
 * 创作内容规格：体裁（content_format）与媒介形式（media_modality）。
 * 与 API discover-taxonomy 枚举对齐，供 Agent 解析、路由与发布推断共用语义。
 */
import type { WorkProfile } from "../schema.js";

export const CONTENT_FORMATS = [
  { id: "note", label: "图文笔记" },
  { id: "short_post", label: "短帖动态" },
  { id: "article", label: "长文深度" },
  { id: "blog", label: "博客专栏" },
  { id: "novel", label: "小说故事" },
  { id: "video_script", label: "视频脚本" },
  { id: "short_video", label: "短视频" },
  { id: "podcast", label: "播客" },
  { id: "music", label: "音乐音频" },
] as const;

export const MEDIA_MODALITIES = [
  { id: "text", label: "纯文字" },
  { id: "image", label: "图文" },
  { id: "audio", label: "音频" },
  { id: "video", label: "视频" },
  { id: "mixed", label: "混合" },
] as const;

export type ContentFormatId = (typeof CONTENT_FORMATS)[number]["id"];
export type MediaModalityId = (typeof MEDIA_MODALITIES)[number]["id"];

const FORMAT_IDS = new Set<string>(CONTENT_FORMATS.map((item) => item.id));
const MODALITY_IDS = new Set<string>(MEDIA_MODALITIES.map((item) => item.id));

const FORMAT_LABELS = Object.fromEntries(
  CONTENT_FORMATS.map((item) => [item.id, item.label]),
) as Record<ContentFormatId, string>;

const MODALITY_LABELS = Object.fromEntries(
  MEDIA_MODALITIES.map((item) => [item.id, item.label]),
) as Record<MediaModalityId, string>;

export function contentFormatLabel(id: string | null | undefined) {
  if (!id) return null;
  return FORMAT_LABELS[id as ContentFormatId] ?? id;
}

export function mediaModalityLabel(id: string | null | undefined) {
  if (!id) return null;
  return MODALITY_LABELS[id as MediaModalityId] ?? id;
}

function normalizeContentFormatFromType(contentType: string | null | undefined) {
  const value = contentType?.trim();
  if (!value) return null;

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

function inferContentFormat(profile: WorkProfile) {
  const fromType = normalizeContentFormatFromType(profile.content_type);
  if (fromType) return fromType as ContentFormatId;

  const platform = profile.platform ?? "yougan";
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

function inferMediaModality(profile: WorkProfile) {
  const contentType = profile.content_type?.trim() ?? "";
  if (/音频|播客|音乐|BGM|歌曲|语音/.test(contentType)) return "audio";
  if (/视频|口播|短视频|Vlog|vlog|分镜/.test(contentType)) return "video";
  if (/图文|配图|种草|笔记/.test(contentType)) return "mixed";
  if (/图片|封面|海报/.test(contentType)) return "image";
  return "text";
}

export function isValidContentFormat(value: string | null | undefined): value is ContentFormatId {
  return Boolean(value && FORMAT_IDS.has(value));
}

export function isValidMediaModality(value: string | null | undefined): value is MediaModalityId {
  return Boolean(value && MODALITY_IDS.has(value));
}

/** 补齐 profile 中缺失或无效的 content_format / media_modality */
export function resolveContentSpec(profile: WorkProfile): WorkProfile {
  const content_format = isValidContentFormat(profile.content_format)
    ? profile.content_format
    : inferContentFormat(profile);
  const media_modality = isValidMediaModality(profile.media_modality)
    ? profile.media_modality
    : inferMediaModality(profile);

  if (
    profile.content_format === content_format &&
    profile.media_modality === media_modality
  ) {
    return profile;
  }

  return {
    ...profile,
    content_format,
    media_modality,
  };
}

export function contentSpecSummary(profile: WorkProfile) {
  const resolved = resolveContentSpec(profile);
  const format = contentFormatLabel(resolved.content_format);
  const modality = mediaModalityLabel(resolved.media_modality);
  const parts = [
    format ? `体裁：${format}` : null,
    modality ? `形式：${modality}` : null,
    resolved.content_type ? `类型描述：${resolved.content_type}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join("；") : "尚未确定体裁与形式";
}

export type CreationPipelineId =
  | "text"
  | "image"
  | "audio"
  | "video";

/** 按媒介形式路由创作 pipeline（当前 image/audio/video 仍走文字出稿，预留独立节点） */
export function routeCreationPipeline(
  mediaModality: MediaModalityId | null | undefined,
): CreationPipelineId {
  switch (mediaModality) {
    case "image":
    case "mixed":
      return "image";
    case "audio":
      return "audio";
    case "video":
      return "video";
    default:
      return "text";
  }
}
