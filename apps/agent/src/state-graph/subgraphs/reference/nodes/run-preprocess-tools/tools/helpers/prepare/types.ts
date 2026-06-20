import type { MediaKind } from "@yougan/domain";

/** 分模态预处理后的素材，供单次 structured 分析消费 */
export type ReferenceAssetPrep = {
  media_kind: MediaKind;
  descriptor: string;
  text_excerpt?: string;
  image_url?: string;
  audio_data?: string;
  audio_format?: string;
  notes: string[];
};
