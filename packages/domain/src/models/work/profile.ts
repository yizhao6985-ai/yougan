import type { ContentFormatId } from "../content-form/formats.js";
import type { MediaModalityId } from "../content-form/modalities.js";

/** 方案向导步骤（含虚拟完成态 ready） */
export type ProfileSetupStep = ProfileStepId | "ready";

/** 方案步骤 id（与 WorkProfile 顶层键一致；ready 为虚拟完成态） */
export type ProfileStepId =
  | "direction"
  | "style"
  | "context"
  | "sequence"
  | "bounds";

/** 方向链：定位 · 形式 · 受众 */
export interface ProfileDirection {
  summary: string;
  format: ContentFormatId | null;
  audience?: string | null;
}

/** 风格：全稿默认调子 */
export interface ProfileStyle {
  verbal?: string | null;
  visual?: string | null;
}

/** 离散说明（context / bounds 共用） */
export interface ProfileSpecItem {
  id: string;
  spec: string;
}

/** 有序节拍 */
export const SEQUENCE_ROLES = ["text", "image", "audio", "video"] as const;

export type SequenceRole = (typeof SEQUENCE_ROLES)[number];

export interface ProfileSequenceItem {
  id: string;
  spec: string;
  role?: SequenceRole | null;
}

/**
 * 作品制作方案。
 * references 在 Work 顶层维护，不在 profile 内。
 */
export interface WorkProfile {
  direction: ProfileDirection;
  style?: ProfileStyle;
  /** 正向离散：世界设定、品牌信息等 */
  context: ProfileSpecItem[];
  /** 有序意图：成文节拍、插图/插媒体（软参考） */
  sequence: ProfileSequenceItem[];
  /** 反向离散：边界与禁止项 */
  bounds: ProfileSpecItem[];
}

/** 运行时推断的内容形态（创作阶段不含发布分类） */
export type ContentFormSpec = {
  format: ContentFormatId | null;
  modalities: MediaModalityId[];
};

// —— 运行时媒介规格（由 format 推断，不入库） ——

export interface TextMediaParams {
  word_count?: { min?: number; max?: number };
  emoji_level?: "none" | "light" | "heavy";
}

export interface ImageMediaParams {
  aspect_ratio?: string;
}

export interface VideoMediaParams {
  duration_sec?: number;
  aspect_ratio?: string;
  pacing?: "fast" | "medium" | "slow" | string;
}

export interface AudioMediaParams {
  duration_sec?: number;
}

export interface ContentFormMediaParams {
  text?: TextMediaParams;
  image?: ImageMediaParams;
  video?: VideoMediaParams;
  audio?: AudioMediaParams;
}

export const EMPTY_PROFILE_DIRECTION: ProfileDirection = {
  summary: "",
  format: null,
  audience: null,
};

export const EMPTY_WORK_PROFILE: WorkProfile = {
  direction: { ...EMPTY_PROFILE_DIRECTION },
  style: {},
  context: [],
  sequence: [],
  bounds: [],
};

export const PROFILE_STEP_IDS: ProfileStepId[] = [
  "direction",
  "style",
  "context",
  "sequence",
  "bounds",
];
