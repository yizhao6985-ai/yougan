export const DISCOVER_FORMATS = [
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

export const DISCOVER_TOPIC_CATEGORIES = [
  { id: "life", label: "生活方式" },
  { id: "career", label: "职场成长" },
  { id: "tech", label: "科技数码" },
  { id: "culture", label: "人文艺术" },
  { id: "story", label: "故事叙事" },
  { id: "knowledge", label: "知识干货" },
  { id: "brand", label: "品牌营销" },
  { id: "general", label: "综合" },
] as const;

export const DISCOVER_MEDIA_TYPES = [
  { id: "text", label: "纯文字" },
  { id: "image", label: "图文" },
  { id: "audio", label: "音频" },
  { id: "video", label: "视频" },
  { id: "mixed", label: "混合" },
] as const;

export const DISCOVER_PLATFORMS = [
  { id: "yougan", label: "有感" },
  { id: "xiaohongshu", label: "小红书" },
  { id: "weibo", label: "微博" },
  { id: "wechat", label: "微信公众号" },
  { id: "douyin", label: "抖音" },
  { id: "kuaishou", label: "快手" },
  { id: "bilibili", label: "哔哩哔哩" },
] as const;

export const DISCOVER_INTENT_ENTRIES = [
  {
    id: "story",
    label: "读故事",
    description: "小说、叙事与人物",
    filters: { topicCategory: "story" },
  },
  {
    id: "knowledge",
    label: "看干货",
    description: "教程、方法与科普",
    filters: { topicCategory: "knowledge" },
  },
  {
    id: "notes",
    label: "刷笔记",
    description: "种草、生活与日常",
    filters: { contentFormat: "note" },
  },
  {
    id: "audio",
    label: "听内容",
    description: "播客、音乐与音频",
    filters: { mediaType: "audio" },
  },
  {
    id: "video",
    label: "看视频",
    description: "短视频与口播",
    filters: { mediaType: "video" },
  },
] as const;

export type DiscoverFilters = {
  platform?: string;
  contentFormat?: string;
  topicCategory?: string;
  mediaType?: string;
};

export type DiscoverFacetOption = {
  id: string;
  label: string;
  count: number;
};

export type DiscoverFacets = {
  platform: DiscoverFacetOption[];
  contentFormat: DiscoverFacetOption[];
  topicCategory: DiscoverFacetOption[];
  mediaType: DiscoverFacetOption[];
};

export type PublicationMetadataOverrides = {
  platform?: string;
  contentFormat?: string;
  topicCategory?: string;
  mediaType?: string;
};

export type PublicationMetadataPreview = {
  metadata: {
    platform: string;
    contentFormat: string;
    topicCategory: string;
    mediaType: string;
    contentTopic: string | null;
    contentType: string | null;
  };
  labels: {
    platform: string | null;
    contentFormat: string | null;
    topicCategory: string | null;
    mediaType: string | null;
  };
};

export const EMPTY_DISCOVER_FILTERS: DiscoverFilters = {};

export function formatLabel(id: string | null | undefined) {
  if (!id) return null;
  return DISCOVER_FORMATS.find((item) => item.id === id)?.label ?? id;
}

export function topicCategoryLabel(id: string | null | undefined) {
  if (!id) return null;
  return DISCOVER_TOPIC_CATEGORIES.find((item) => item.id === id)?.label ?? id;
}

export function mediaTypeLabel(id: string | null | undefined) {
  if (!id) return null;
  return DISCOVER_MEDIA_TYPES.find((item) => item.id === id)?.label ?? id;
}

export function platformTaxonomyLabel(id: string | null | undefined) {
  if (!id) return null;
  return DISCOVER_PLATFORMS.find((item) => item.id === id)?.label ?? id;
}

export function parseDiscoverFilters(
  searchParams: URLSearchParams,
): DiscoverFilters {
  const filters: DiscoverFilters = {};
  const platform = searchParams.get("platform");
  const contentFormat = searchParams.get("format");
  const topicCategory = searchParams.get("topic");
  const mediaType = searchParams.get("media");

  if (platform && DISCOVER_PLATFORMS.some((item) => item.id === platform)) {
    filters.platform = platform;
  }
  if (
    contentFormat &&
    DISCOVER_FORMATS.some((item) => item.id === contentFormat)
  ) {
    filters.contentFormat = contentFormat;
  }
  if (
    topicCategory &&
    DISCOVER_TOPIC_CATEGORIES.some((item) => item.id === topicCategory)
  ) {
    filters.topicCategory = topicCategory;
  }
  if (
    mediaType &&
    DISCOVER_MEDIA_TYPES.some((item) => item.id === mediaType)
  ) {
    filters.mediaType = mediaType;
  }

  return filters;
}

export function buildDiscoverSearchParams(filters: DiscoverFilters) {
  const params = new URLSearchParams();
  if (filters.platform) params.set("platform", filters.platform);
  if (filters.contentFormat) params.set("format", filters.contentFormat);
  if (filters.topicCategory) params.set("topic", filters.topicCategory);
  if (filters.mediaType) params.set("media", filters.mediaType);
  return params;
}

export function countActiveDiscoverFilters(filters: DiscoverFilters) {
  return Object.values(filters).filter(Boolean).length;
}

export function clearDiscoverFilterKey(
  filters: DiscoverFilters,
  key: keyof DiscoverFilters,
): DiscoverFilters {
  const next = { ...filters };
  delete next[key];
  return next;
}

export function mergeDiscoverFilters(
  base: DiscoverFilters,
  patch: DiscoverFilters,
): DiscoverFilters {
  return { ...base, ...patch };
}
