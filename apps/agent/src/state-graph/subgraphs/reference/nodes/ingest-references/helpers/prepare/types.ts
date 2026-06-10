import type { MediaKind } from "@yougan/domain";

/** 分模态预处理后的素材，供单次 structured 分析消费 */
export type ReferenceAssetPrep = {
  media_kind: MediaKind;
  user_context?: string | null;
  descriptor: string;
  text_excerpt?: string;
  transcript?: string;
  image_url?: string;
  video_frames?: Buffer[];
  notes: string[];
};

export type ReferenceAudioPrep = {
  transcript?: string;
  notes: string[];
};

export type ReferenceVideoPrep = {
  transcript?: string;
  frames: Buffer[];
  notes: string[];
};
