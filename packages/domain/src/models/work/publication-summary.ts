import type { DiscoverTopicCategoryId } from "../discover/index.js";
import type { MediaModalityId } from "../content-form/modalities.js";

/** 从 preview 机械统计的构成信息，用于发现页筛选 */
export interface BlockComposition {
  blockTypes: MediaModalityId[];
  textBlockCount: number;
  imageCount: number;
  audioCount: number;
  videoCount: number;
  textLength: number;
  totalAudioDurationSec: number | null;
  totalVideoDurationSec: number | null;
}

/** 发现页列表封面 */
export interface PublicationCover {
  url: string;
  sourceImageId: string | null;
}

/**
 * 发布摘要：Agent / 规则从 preview 提炼，供推荐流与发布确认。
 */
export interface PublicationSummary {
  title: string;
  hook: string;
  cover: PublicationCover;
  compositionLabel: string;
  consumptionHint: string | null;
  topicCategory: DiscoverTopicCategoryId;
  blockComposition: BlockComposition;
  mediaTypes: MediaModalityId[];
}

/** 发布确认时用户可覆盖的字段 */
export type PublicationSummaryOverrides = {
  title?: string;
  hook?: string;
  /** 从 preview 配图中选择的封面；传 null 表示不选 preview 内图片 */
  coverImageId?: string | null;
  /** 用户上传的封面 URL；与 coverImageId 互斥，优先于 coverImageId */
  coverUrl?: string | null;
  compositionLabel?: string;
  topicCategory?: string;
};

export type PublicationSummaryPreview = {
  summary: PublicationSummary;
  labels: {
    topicCategory: string | null;
    compositionLabel: string;
    consumptionHint: string | null;
  };
};
