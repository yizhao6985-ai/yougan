import type { ContentFormatId, MediaModalityId } from "../taxonomy/content.js";
import type { DiscoverPlatformId, DiscoverTopicCategoryId } from "../taxonomy/discover.js";

/**
 * 交付规格：机器权威字段，决定子图路由、制作管线与发布推断。
 * 与 expression / blueprint 分离，避免「写什么」与「怎么写」混在一起。
 */
export interface ProfileDelivery {
  /** 创作主题（一句话题眼） */
  topic: string;
  /** 体裁 id，见 CONTENT_FORMATS */
  format: ContentFormatId;
  /** 交付媒介组合，如 ["text"]、["text", "image"] */
  modalities: MediaModalityId[];
  /** 目标发布平台（可选） */
  platform?: DiscoverPlatformId | null;
  /** 内容分类（发现页 taxonomy） */
  category?: DiscoverTopicCategoryId | null;
  /** 用户原话摘录，仅展示，不参与路由 */
  intent?: string | null;
}

/** 表达设定：受众、语气文风与画面气质 */
export interface ProfileExpression {
  audience?: string | null;
  verbal?: {
    tone?: string | null;
    style?: string | null;
    persona?: string | null;
  };
  visual?: {
    style?: string | null;
    mood?: string | null;
    palette?: string | null;
  };
}

/** 结构段角色（跨体裁复用，按叙事/镜头语义选用） */
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

/** 有序结构段；id 供 profile 工具 update/delete 引用 */
export interface ProfileSegment {
  id: string;
  confirmed_at: string;
  role?: SegmentRole | null;
  title?: string | null;
  description: string;
}

/** 固定设定类型（对象、背景等，不参与内容时序） */
export type ProfileSettingKind = "character" | "world" | "other";

/** 固定创作设定；id 供 profile 工具 update/delete 引用 */
export interface ProfileSetting {
  id: string;
  confirmed_at: string;
  kind: ProfileSettingKind;
  title?: string | null;
  description: string;
}

/** 内容蓝图：一句话定位 + 固定设定 + 结构段列表 */
export interface ProfileBlueprint {
  summary: string;
  settings: ProfileSetting[];
  segments: ProfileSegment[];
}

/** 创作规则生效范围 */
export type GuardrailScope = "all" | "verbal" | "visual" | "audio" | "video";

/** 硬性创作约束（禁用词、必提要素、尺度边界等） */
export interface ProfileGuardrail {
  id: string;
  confirmed_at: string;
  description: string;
  scope: GuardrailScope;
}

export interface TextFormatParams {
  kind: "text";
  word_count?: { min?: number; max?: number };
  emoji_level?: "none" | "light" | "heavy";
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

/** 体裁参数（与 delivery.format 对应，互斥 union） */
export type FormatParams =
  | TextFormatParams
  | IllustrationFormatParams
  | VideoFormatParams
  | AudioFormatParams;

/**
 * 作品创作方案（state 顶层 profile）。
 * 不含 references——参考素材在 Work.references 顶层维护（API schema）。
 */
export interface WorkProfile {
  delivery: ProfileDelivery;
  expression: ProfileExpression;
  blueprint: ProfileBlueprint;
  guardrails: ProfileGuardrail[];
  params: FormatParams;
}

export const EMPTY_PROFILE_DELIVERY: ProfileDelivery = {
  topic: "",
  format: "short_post",
  modalities: ["text"],
  platform: null,
  category: null,
  intent: null,
};

export const EMPTY_WORK_PROFILE: WorkProfile = {
  delivery: { ...EMPTY_PROFILE_DELIVERY },
  expression: {},
  blueprint: { summary: "", settings: [], segments: [] },
  guardrails: [],
  params: { kind: "text" },
};
