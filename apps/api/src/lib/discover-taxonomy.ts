export const DISCOVER_FORMATS = [
  { id: "note", label: "图文笔记" },
  { id: "short_post", label: "短帖动态" },
  { id: "article", label: "长文深度" },
  { id: "video_script", label: "视频脚本" },
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
  { id: "image", label: "含配图" },
  { id: "text", label: "纯文字" },
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

export type DiscoverFormatId = (typeof DISCOVER_FORMATS)[number]["id"];
export type DiscoverTopicCategoryId =
  (typeof DISCOVER_TOPIC_CATEGORIES)[number]["id"];
export type DiscoverMediaTypeId = (typeof DISCOVER_MEDIA_TYPES)[number]["id"];
export type DiscoverPlatformId = (typeof DISCOVER_PLATFORMS)[number]["id"];

type ProfileLike = {
  platform?: string | null;
  content_topic?: string | null;
  content_type?: string | null;
};

type OutputLike = {
  platform?: string;
  body?: string;
  images?: Array<{ url?: string }>;
};

const FORMAT_LABELS = Object.fromEntries(
  DISCOVER_FORMATS.map((item) => [item.id, item.label]),
) as Record<DiscoverFormatId, string>;

const TOPIC_LABELS = Object.fromEntries(
  DISCOVER_TOPIC_CATEGORIES.map((item) => [item.id, item.label]),
) as Record<DiscoverTopicCategoryId, string>;

export function formatLabel(id: string | null | undefined) {
  if (!id) return null;
  return FORMAT_LABELS[id as DiscoverFormatId] ?? id;
}

export function topicCategoryLabel(id: string | null | undefined) {
  if (!id) return null;
  return TOPIC_LABELS[id as DiscoverTopicCategoryId] ?? id;
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

  if (/笔记|种草|图文笔记/.test(value)) return "note";
  if (/短帖|动态|微博|快讯/.test(value)) return "short_post";
  if (/长文|文章|专栏|深度|公众号/.test(value)) return "article";
  if (/脚本|口播|短视频|分镜|视频/.test(value)) return "video_script";

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
      return "video_script";
    case "bilibili":
      return bodyLength > 900 ? "article" : "video_script";
    default:
      if (bodyLength > 900) return "article";
      if (input.hasImage) return "note";
      if (bodyLength > 280) return "short_post";
      return "short_post";
  }
}

export function inferMediaType(input: {
  coverUrl?: string | null;
  images?: unknown;
}) {
  if (input.coverUrl) return "image";
  if (Array.isArray(input.images) && input.images.length > 0) return "image";
  return "text";
}

export function buildPublicationMetadata(input: {
  profile?: ProfileLike | null;
  output?: OutputLike | null;
  coverUrl?: string | null;
  body?: string | null;
  images?: unknown;
  platform?: string | null;
}) {
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

  const contentFormat = inferContentFormat({
    platform,
    contentType,
    body,
    hasImage,
  });
  const topicCategory = normalizeTopicCategory(contentTopic);
  const mediaType = inferMediaType({
    coverUrl: input.coverUrl,
    images: input.images ?? output.images,
  });

  return {
    platform,
    contentFormat,
    topicCategory,
    contentTopic,
    contentType,
    mediaType,
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
