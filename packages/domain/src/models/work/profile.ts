import type { ContentFormatId, MediaModalityId } from "../taxonomy/content.js";

/** 方案向导步骤（含虚拟完成态 ready） */
export type ProfileSetupStep = ProfileStepId | "ready";

/** 方案步骤 id（与 WorkProfile 顶层键一致；ready 为虚拟完成态） */
export type ProfileStepId =
  | "intent"
  | "delivery"
  | "expression"
  | "structure"
  | "constraints";

/** ① 创作定位 */
export interface ProfileIntentStep {
  /** 面向用户/制作的一句话定位 */
  summary: string;
}

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

/** 按媒介拆分的作品规格（支持混排） */
export interface DeliveryMediaParams {
  text?: TextMediaParams;
  image?: ImageMediaParams;
  video?: VideoMediaParams;
  audio?: AudioMediaParams;
}

/** ② 内容形态与规格 */
export interface ProfileDeliveryStep {
  /** 主内容形态（创作模板/归类，不限制实际媒介组合） */
  format: ContentFormatId | null;
  /** 作品实际包含的媒介；混排须全部列出，如 ["text", "image"] */
  modalities: MediaModalityId[];
  /** 各媒介最小单元规格（画幅、字数范围、时长等；不含张数/段落数） */
  media_params: DeliveryMediaParams;
}

/** ③ 表达设定 */
export interface ProfileExpressionStep {
  audience?: string | null;
  verbal?: string | null;
  visual?: string | null;
}

/** 结构段媒介节拍（与作品 blocks 顺序对应） */
export const SEGMENT_ROLES = ["text", "image", "audio", "video"] as const;

export type SegmentRole = (typeof SEGMENT_ROLES)[number];

export interface ProfileSegment {
  id: string;
  confirmed_at: string;
  role?: SegmentRole | null;
  title?: string | null;
  description: string;
}

export type ProfileSettingKind = "character" | "world" | "other";

export interface ProfileSetting {
  id: string;
  confirmed_at: string;
  kind: ProfileSettingKind;
  title?: string | null;
  description: string;
}

/** ④ 结构与要素 */
export interface ProfileStructureStep {
  settings: ProfileSetting[];
  segments: ProfileSegment[];
}

export type ConstraintScope = "all" | "verbal" | "visual" | "audio" | "video";

/** ⑤ 创作规则条目 */
export interface ProfileConstraint {
  id: string;
  confirmed_at: string;
  description: string;
  scope: ConstraintScope;
}

/** ⑤ 创作规则 */
export interface ProfileConstraintsStep {
  rules: ProfileConstraint[];
}

/**
 * 作品制作方案：按步骤组织。
 * references 在 Work 顶层维护，不在 profile 内。
 */
export interface WorkProfile {
  intent: ProfileIntentStep;
  delivery: ProfileDeliveryStep;
  expression: ProfileExpressionStep;
  structure: ProfileStructureStep;
  constraints: ProfileConstraintsStep;
}

/** 运行时推断交付规格（创作阶段不含发布分类） */
export type DeliverySpec = {
  format: ContentFormatId | null;
  modalities: MediaModalityId[];
};

export const EMPTY_PROFILE_INTENT: ProfileIntentStep = {
  summary: "",
};

export const EMPTY_PROFILE_DELIVERY: ProfileDeliveryStep = {
  format: null,
  modalities: [],
  media_params: {},
};

export const EMPTY_PROFILE_STRUCTURE: ProfileStructureStep = {
  settings: [],
  segments: [],
};

export const EMPTY_PROFILE_CONSTRAINTS: ProfileConstraintsStep = {
  rules: [],
};

export const EMPTY_WORK_PROFILE: WorkProfile = {
  intent: { ...EMPTY_PROFILE_INTENT },
  delivery: { ...EMPTY_PROFILE_DELIVERY },
  expression: {},
  structure: { ...EMPTY_PROFILE_STRUCTURE },
  constraints: { ...EMPTY_PROFILE_CONSTRAINTS },
};

export const PROFILE_STEP_IDS: ProfileStepId[] = [
  "intent",
  "delivery",
  "expression",
  "structure",
  "constraints",
];
