import {
  CONTENT_FORMATS,
  type ContentFormatId,
} from "../../models/content-form/formats.js";
import type { MediaModalityId } from "../../models/content-form/modalities.js";
import {
  DISCOVER_TOPIC_CATEGORIES,
  type DiscoverTopicCategoryId,
  type PublicationMetadata,
  type PublicationMetadataOverrides,
} from "../../models/discover/index.js";
import type { WorkProfile } from "../../models/work/profile.js";
import type { WorkPreview } from "../../models/work/preview.js";
import {
  inferMediaModalities,
  isMediaModalityId,
  mediaModalitiesLabel,
  mediaModalityLabel,
  sortMediaModalities,
} from "../media-modalities.js";
import {
  previewHasImages,
  previewTextLength,
} from "../work/preview.js";
import { parseProfileJson, resolveContentFormFromProfile, getProfileSummary, getDirectionSummary } from "../work/profile.js";

const FORMAT_LABELS = Object.fromEntries(
  CONTENT_FORMATS.map((item) => [item.id, item.label]),
) as Record<ContentFormatId, string>;

const TOPIC_LABELS = Object.fromEntries(
  DISCOVER_TOPIC_CATEGORIES.map((item) => [item.id, item.label]),
) as Record<DiscoverTopicCategoryId, string>;

export function formatLabel(id: string | null | undefined) {
  if (!id) return null;
  return FORMAT_LABELS[id as ContentFormatId] ?? id;
}

export function topicCategoryLabel(id: string | null | undefined) {
  if (!id) return null;
  return TOPIC_LABELS[id as DiscoverTopicCategoryId] ?? id;
}

export function mediaTypeLabel(
  input: MediaModalityId | MediaModalityId[] | string | null | undefined,
) {
  if (Array.isArray(input)) return mediaModalitiesLabel(input);
  if (!input) return null;
  return mediaModalityLabel(input);
}

export function normalizeTopicCategory(topic: string | null | undefined) {
  const value = topic?.trim();
  if (!value) return "general";

  const rules: Array<{ id: DiscoverTopicCategoryId; pattern: RegExp }> = [
    { id: "career", pattern: /职场|工作|办公|面试|简历|管理|创业/i },
    { id: "tech", pattern: /科技|数码|AI|编程|产品|软件|硬件|互联网/i },
    { id: "culture", pattern: /人文|艺术|读书|电影|音乐|设计|美学/i },
    { id: "story", pattern: /故事|小说|叙事|人物|剧情|散文/i },
    { id: "knowledge", pattern: /知识|干货|教程|学习|方法|技巧|科普/i },
    { id: "brand", pattern: /品牌|营销|推广|运营|转化|种草|带货/i },
    { id: "life", pattern: /生活|旅行|美食|家居|健康|情感|日常|穿搭/i },
  ];

  for (const rule of rules) {
    if (rule.pattern.test(value)) return rule.id;
  }

  return "general";
}

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

export function inferContentFormat(input: {
  contentType?: string | null;
  body?: string | null;
  bodyLength?: number;
  hasImage?: boolean;
}) {
  const fromType = normalizeContentFormatFromType(input.contentType);
  if (fromType) return fromType;

  const bodyLength =
    input.bodyLength ?? input.body?.trim().length ?? 0;

  if (bodyLength > 900) return "article";
  if (input.hasImage) return "note";
  if (bodyLength > 280) return "short_post";
  return "short_post";
}

export function inferMediaTypes(input: {
  coverUrl?: string | null;
  preview?: WorkPreview | null;
  contentType?: string | null;
  contentFormat?: string | null;
}): MediaModalityId[] {
  const preview = input.preview;
  if (preview?.content) {
    const fromPreview = sortMediaModalities(
      analyzePreviewMediaTypes(preview),
    );
    if (fromPreview.length) return fromPreview;
  }

  const bodyLength = previewTextLength(preview);
  const hasImage = Boolean(input.coverUrl) || previewHasImages(preview);

  return inferMediaModalities({
    contentType: input.contentType,
    contentFormat: input.contentFormat,
    hasImage,
    bodyLength,
  });
}

function analyzePreviewMediaTypes(preview: WorkPreview): MediaModalityId[] {
  const types: MediaModalityId[] = [];
  if (previewTextLength(preview) > 0) types.push("text");
  if (previewHasImages(preview)) types.push("image");
  return types.filter(isMediaModalityId);
}

export function buildPublicationMetadata(input: {
  profile?: WorkProfile | unknown | null;
  preview?: WorkPreview | null;
  coverUrl?: string | null;
}): PublicationMetadata {
  const preview = input.preview ?? null;
  const bodyLength = previewTextLength(preview);
  const hasImage =
    Boolean(input.coverUrl) || previewHasImages(preview);

  const contentForm = input.profile
    ? resolveContentFormFromProfile(parseProfileJson(input.profile))
    : null;

  const profile = input.profile ? parseProfileJson(input.profile) : null;

  const contentTopic = profile ? getDirectionSummary(profile) || null : null;
  const contentType = profile ? getProfileSummary(profile) : null;

  const contentFormat =
    contentForm?.format &&
    CONTENT_FORMATS.some((item) => item.id === contentForm.format)
      ? contentForm.format
      : inferContentFormat({
          contentType,
          bodyLength,
          hasImage,
        });

  const topicCategory = normalizeTopicCategory(contentTopic);

  const mediaTypes = contentForm?.modalities?.length
    ? sortMediaModalities(contentForm.modalities)
    : inferMediaTypes({
        coverUrl: input.coverUrl,
        preview,
        contentType,
        contentFormat,
      });

  return {
    contentFormat,
    topicCategory,
    contentTopic,
    contentType,
    mediaTypes,
  };
}

function isValidCatalogId<T extends { id: string }>(
  items: readonly T[],
  id: string | undefined,
) {
  return Boolean(id && items.some((item) => item.id === id));
}

export function applyMetadataOverrides(
  metadata: PublicationMetadata,
  overrides?: PublicationMetadataOverrides | null,
): PublicationMetadata {
  if (!overrides) return metadata;

  const mediaTypes = overrides.mediaTypes?.length
    ? sortMediaModalities(
        overrides.mediaTypes.filter((item): item is MediaModalityId =>
          isMediaModalityId(item),
        ),
      )
    : overrides.mediaType && isMediaModalityId(overrides.mediaType)
      ? [overrides.mediaType]
      : metadata.mediaTypes;

  return {
    ...metadata,
    contentFormat: isValidCatalogId(CONTENT_FORMATS, overrides.contentFormat)
      ? overrides.contentFormat!
      : metadata.contentFormat,
    topicCategory: isValidCatalogId(
      DISCOVER_TOPIC_CATEGORIES,
      overrides.topicCategory,
    )
      ? (overrides.topicCategory as DiscoverTopicCategoryId)
      : metadata.topicCategory,
    mediaTypes: mediaTypes.length ? mediaTypes : metadata.mediaTypes,
  };
}

export function buildMetadataLabels(metadata: PublicationMetadata) {
  return {
    contentFormat: formatLabel(metadata.contentFormat),
    topicCategory: topicCategoryLabel(metadata.topicCategory),
    mediaTypes: mediaModalitiesLabel(metadata.mediaTypes),
  };
}

export function buildFacetOptions<T extends { id: string; label: string }>(
  items: readonly T[],
  counts: Record<string, number>,
) {
  return items
    .map((item) => ({
      id: item.id,
      label: item.label,
      count: counts[item.id] ?? 0,
    }))
    .filter((item) => item.count > 0);
}
