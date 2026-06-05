import {
  CONTENT_FORMATS,
  type ContentFormatId,
  type MediaModalityId,
} from "../../models/content/catalog.js";
import {
  DISCOVER_PLATFORMS,
  DISCOVER_TOPIC_CATEGORIES,
  type DiscoverFormatId,
  type DiscoverMediaTypeId,
  type DiscoverPlatformId,
  type DiscoverTopicCategoryId,
  type PublicationMetadata,
  type PublicationMetadataOverrides,
} from "../../models/discover/taxonomy.js";
import {
  inferMediaModalities,
  isMediaModalityId,
  mediaModalitiesLabel,
  mediaModalityLabel,
  normalizeMediaModalities,
  sortMediaModalities,
} from "../media-modalities.js";

const FORMAT_LABELS = Object.fromEntries(
  CONTENT_FORMATS.map((item) => [item.id, item.label]),
) as Record<ContentFormatId, string>;

const TOPIC_LABELS = Object.fromEntries(
  DISCOVER_TOPIC_CATEGORIES.map((item) => [item.id, item.label]),
) as Record<DiscoverTopicCategoryId, string>;

const PLATFORM_LABELS = Object.fromEntries(
  DISCOVER_PLATFORMS.map((item) => [item.id, item.label]),
) as Record<DiscoverPlatformId, string>;

type ProfileLike = {
  platform?: string | null;
  content_topic?: string | null;
  content_type?: string | null;
  content_format?: string | null;
  media_modalities?: MediaModalityId[];
  /** @deprecated */
  media_modality?: string | null;
};

type OutputLike = {
  platform?: string;
  body?: string;
  images?: Array<{ url?: string }>;
};

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

export function platformTaxonomyLabel(id: string | null | undefined) {
  if (!id) return null;
  return PLATFORM_LABELS[id as DiscoverPlatformId] ?? id;
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
  platform?: string | null;
  contentType?: string | null;
  body?: string | null;
  hasImage?: boolean;
}) {
  const fromType = normalizeContentFormatFromType(input.contentType);
  if (fromType) return fromType;

  const platform = input.platform ?? "yougan";
  const bodyLength = input.body?.trim().length ?? 0;

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
      return bodyLength > 900 ? "article" : "video_script";
    default:
      if (bodyLength > 900) return "article";
      if (input.hasImage) return "note";
      if (bodyLength > 280) return "short_post";
      return "short_post";
  }
}

export function inferMediaTypes(input: {
  coverUrl?: string | null;
  images?: unknown;
  contentType?: string | null;
  body?: string | null;
  contentFormat?: string | null;
}): MediaModalityId[] {
  const bodyLength = input.body?.trim().length ?? 0;
  const hasImage =
    Boolean(input.coverUrl) ||
    (Array.isArray(input.images) && input.images.length > 0);

  return inferMediaModalities({
    contentType: input.contentType,
    contentFormat: input.contentFormat,
    hasImage,
    bodyLength,
  });
}

export function buildPublicationMetadata(input: {
  profile?: ProfileLike | null;
  output?: OutputLike | null;
  coverUrl?: string | null;
  body?: string | null;
  images?: unknown;
  platform?: string | null;
}): PublicationMetadata {
  const profile = input.profile ?? {};
  const output = input.output ?? {};
  const platform =
    input.platform ?? output.platform ?? profile.platform ?? "yougan";
  const contentTopic = profile.content_topic?.trim() || null;
  const contentType = profile.content_type?.trim() || null;
  const body = input.body ?? output.body ?? null;
  const hasImage =
    Boolean(input.coverUrl) ||
    (Array.isArray(input.images) && input.images.length > 0) ||
    (Array.isArray(output.images) && output.images.length > 0);

  const contentFormat =
    profile.content_format &&
    CONTENT_FORMATS.some((item) => item.id === profile.content_format)
      ? profile.content_format
      : inferContentFormat({
          platform,
          contentType,
          body,
          hasImage,
        });
  const topicCategory = normalizeTopicCategory(contentTopic);
  const mediaTypes = profile.media_modalities?.length
    ? sortMediaModalities(profile.media_modalities)
    : profile.media_modality
      ? normalizeMediaModalities(
          profile.media_modality,
          profile.content_format ?? contentFormat,
        )
      : inferMediaTypes({
          coverUrl: input.coverUrl,
          images: input.images ?? output.images,
          contentType,
          body,
          contentFormat,
        });

  return {
    platform,
    contentFormat,
    topicCategory,
    contentTopic,
    contentType,
    mediaTypes,
  };
}

function isValidCatalogId<T extends { id: string }>(
  catalog: readonly T[],
  id: string | undefined,
) {
  return Boolean(id && catalog.some((item) => item.id === id));
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
    platform: isValidCatalogId(DISCOVER_PLATFORMS, overrides.platform)
      ? overrides.platform!
      : metadata.platform,
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
    platform: platformTaxonomyLabel(metadata.platform),
    contentFormat: formatLabel(metadata.contentFormat),
    topicCategory: topicCategoryLabel(metadata.topicCategory),
    mediaTypes: mediaModalitiesLabel(metadata.mediaTypes),
  };
}

export function buildFacetOptions<T extends { id: string; label: string }>(
  catalog: readonly T[],
  counts: Record<string, number>,
) {
  return catalog
    .map((item) => ({
      id: item.id,
      label: item.label,
      count: counts[item.id] ?? 0,
    }))
    .filter((item) => item.count > 0);
}

export type { DiscoverFormatId, DiscoverMediaTypeId };
