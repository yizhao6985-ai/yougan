/**
 * 发现页与发布元数据 taxonomy。
 * 复用 taxonomy/content 的体裁与媒介 id；扩展分类、意图入口与筛选结构。
 */
import {
  CONTENT_FORMATS,
  MEDIA_MODALITIES,
  type MediaModalityId,
} from "./content.js";

export { CONTENT_FORMATS as DISCOVER_FORMATS };
export { MEDIA_MODALITIES as DISCOVER_MEDIA_TYPES };

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
    description: "图文混排、适合扫读",
    filters: { mixedTextImage: true },
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
  {
    id: "visual",
    label: "看绘画",
    description: "插画、海报与视觉艺术",
    filters: { contentFormat: "illustration" },
  },
] as const;

export type DiscoverFormatId = (typeof CONTENT_FORMATS)[number]["id"];
export type DiscoverTopicCategoryId =
  (typeof DISCOVER_TOPIC_CATEGORIES)[number]["id"];
export type DiscoverMediaTypeId = (typeof MEDIA_MODALITIES)[number]["id"];

export type {
  PublicationSummaryOverrides,
  PublicationSummaryPreview,
} from "../work/publication-summary.js";

import type { PublicationSummaryPreview } from "../work/publication-summary.js";

export type DiscoverFilters = {
  contentFormat?: string;
  topicCategory?: string;
  /** 筛选包含该媒介原子的内容 */
  mediaType?: MediaModalityId;
  /** 图文混排（刷笔记）：同时含 text 与 image */
  mixedTextImage?: boolean;
};

export type DiscoverFacetOption = {
  id: string;
  label: string;
  count: number;
};

export type DiscoverFacets = {
  contentFormat: DiscoverFacetOption[];
  topicCategory: DiscoverFacetOption[];
  mediaType: DiscoverFacetOption[];
};

export type PublicationMetadata = {
  contentFormat: string;
  topicCategory: DiscoverTopicCategoryId;
  contentTopic: string | null;
  contentType: string | null;
  mediaTypes: MediaModalityId[];
};

export type PublicationMetadataOverrides = {
  contentFormat?: string;
  topicCategory?: string;
  mediaType?: MediaModalityId;
  mediaTypes?: MediaModalityId[];
};

export type PublicationMetadataPreview = PublicationSummaryPreview;

export const EMPTY_DISCOVER_FILTERS: DiscoverFilters = {};
