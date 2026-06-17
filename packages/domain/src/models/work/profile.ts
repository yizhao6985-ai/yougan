import type { ContentFormatId, MediaModalityId } from "../taxonomy/content.js";
import type { DiscoverTopicCategoryId } from "../taxonomy/discover.js";

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

/** ② 体裁与参数 */
export interface ProfileDeliveryStep {
  format: ContentFormatId | null;
  modalities: MediaModalityId[];
  platform?: string | null;
  category?: DiscoverTopicCategoryId | null;
  params: FormatParams;
}

/** ③ 表达设定 */
export interface ProfileExpressionStep {
  audience?: string | null;
  verbal?: string | null;
  visual?: string | null;
}

/** 结构段角色（跨体裁复用） */
export type SegmentRole =
  | "hook"
  | "context"
  | "point"
  | "example"
  | "cta"
  | "chapter"
  | "scene"
  | "shot"
  | "broll"
  | "transition"
  | "subject"
  | "composition"
  | "detail"
  | "intro"
  | "segment"
  | "outro"
  | "bridge";

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

export interface TextFormatParams {
  kind: "text";
  word_count?: { min?: number; max?: number };
  emoji_level?: "none" | "light" | "heavy";
  /** 图文混排等体裁的配图画幅（design 出图时使用） */
  aspect_ratio?: string;
}

export interface IllustrationFormatParams {
  kind: "illustration";
  aspect_ratio?: "1:1" | "3:4" | "4:3" | "16:9" | "9:16" | string;
  image_count?: number;
  negative_hints?: string[];
}

export interface VideoFormatParams {
  kind: "video";
  duration_sec?: number;
  aspect_ratio?: string;
  pacing?: "fast" | "medium" | "slow" | string;
}

export interface AudioFormatParams {
  kind: "audio";
  duration_sec?: number;
  segment_count?: number;
}

export type FormatParams =
  | TextFormatParams
  | IllustrationFormatParams
  | VideoFormatParams
  | AudioFormatParams;

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

/** 运行时推断交付规格时的输入（delivery 字段；创作定位见 profile.intent.summary） */
export type DeliverySpec = {
  format: ContentFormatId | null;
  modalities: MediaModalityId[];
  platform?: string | null;
  category?: DiscoverTopicCategoryId | null;
};

export const EMPTY_PROFILE_INTENT: ProfileIntentStep = {
  summary: "",
};

export const EMPTY_PROFILE_DELIVERY: ProfileDeliveryStep = {
  format: null,
  modalities: [],
  platform: null,
  category: null,
  params: { kind: "text" },
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
