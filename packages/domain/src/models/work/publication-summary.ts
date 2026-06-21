import type { DiscoverTopicCategoryId } from "../discover/index.js";
import type { MediaModalityId } from "../content-form/modalities.js";
import type { PreviewBlockType } from "./preview.js";

/** 从 blocks 机械统计的构成信息，用于发现页筛选 */
export interface BlockComposition {
  blockTypes: PreviewBlockType[];
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
  sourceBlockId: string | null;
}

/**
 * 发布摘要：Agent / 规则从 blocks 提炼，供推荐流与发布确认。
 * 详情页消费仍使用完整 blocks[]。
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
  /** 用户上传的封面 URL；不传或传 null 表示无封面 */
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
