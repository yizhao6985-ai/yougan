import type { ContentFormatId } from "../content-form/formats.js";
import type { MediaModalityId } from "../content-form/modalities.js";

/** 方案向导步骤（含虚拟完成态 ready） */
export type ProfileSetupStep = ProfileStepId | "ready";

/** 方案步骤 id（与 WorkProfile 顶层键一致；ready 为虚拟完成态） */
export type ProfileStepId =
  | "direction"
  | "style"
  | "setting"
  | "requirements"
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

/** 离散说明（setting / bounds / requirements 共用） */
export interface ProfileSpecItem {
  id: string;
  spec: string;
}

/** 需求项（有序列表；数组顺序即内容顺序） */
export type ProfileRequirementItem = ProfileSpecItem;

/**
 * 作品制作方案。
 * references 在 Work 顶层维护，不在 profile 内。
 */
export interface WorkProfile {
  direction: ProfileDirection;
  style?: ProfileStyle;
  /** 背景/设定：品牌事实、故事背景、人设等 */
  setting: ProfileSpecItem[];
  /** 需求：对成稿的期望（规格、结构顺序等） */
  requirements: ProfileRequirementItem[];
  /** 边界：不要出现的内容与写法禁忌 */
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
  setting: [],
  requirements: [],
  bounds: [],
};

export const PROFILE_STEP_IDS: ProfileStepId[] = [
  "direction",
  "style",
  "setting",
  "requirements",
  "bounds",
];
