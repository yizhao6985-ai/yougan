/**
 * 全项目共享的类型、常量与工厂函数。
 *
 * 三模式流水线数据分工：
 *   WorkInspiration  — 灵感探索（confirmed_requirements + summary）
 *   WorkOutline      — 大纲条目（pending_changes）+ 已落地（executed_changes）
 *   GeneratedContent — 创作产出（title/body）
 *   WorkProfile      — 跨模式共用的平台/风格/受众等特征
 */
import { nanoid } from "nanoid";

/** 创作模式：灵感 → 大纲 → 创作 */
export const CHAT_MODES = ["inspiration", "outline", "creation"] as const;

export type ChatMode = (typeof CHAT_MODES)[number];

export const CHAT_MODE_LABELS: Record<ChatMode, string> = {
  inspiration: "灵感模式",
  outline: "大纲模式",
  creation: "创作模式",
};

export const MODE_WORK_JSON_FIELDS = {
  inspiration: "inspiration",
  outline: "outline",
  creation: "creation",
} as const satisfies Record<ChatMode, keyof WorkJsonFieldMap>;

export type WorkJsonFieldMap = {
  inspiration: WorkInspiration;
  outline: WorkOutline;
  creation: GeneratedContent | null;
};

export interface ReferenceItem {
  source_type: "text" | "image" | "web";
  summary: string;
  keywords?: string[];
  tone_hints?: string[];
  structure_hints?: string[];
  hashtags?: string[];
  raw_excerpt?: string | null;
  image_url?: string | null;
  url?: string | null;
  title?: string | null;
}

export interface WorkProfile {
  platform?: string | null;
  content_topic?: string | null;
  content_type?: string | null;
  content_points?: string[];
  style?: string | null;
  tone?: string | null;
  persona?: string | null;
  style_constraints?: string[];
  audience?: string | null;
  goals?: string[];
  notes?: string | null;
  references?: ReferenceItem[];
}

/** 待实现 / 待执行的大纲条目（大纲模式撰写，创作模式消费） */
export interface OutlineChange {
  id: string;
  description: string;
  created_at: string;
}

/** @deprecated 使用 OutlineChange */
export type PlanChange = OutlineChange;

/** 已在作品中落地的条目（创作 complete_execution 或灵感对照同步写入） */
export interface ExecutedChange {
  id: string;
  description: string;
  executed_at: string;
  batch_summary?: string | null;
}

/** 大纲模式状态，对应 Work.outline */
export interface WorkOutline {
  pending_changes: OutlineChange[];
  executed_changes: ExecutedChange[];
  last_execution_summary?: string | null;
  outline_summary?: string | null;
  outline_ready?: boolean;
}

/** @deprecated 使用 WorkOutline */
export type WorkPlan = WorkOutline;

/** 用户逐条确认的灵感（灵感模式 CRUD 操作对象） */
export interface ConfirmedRequirement {
  id: string;
  description: string;
  confirmed_at: string;
}

/** 灵感模式状态，对应 Work.inspiration */
export interface WorkInspiration {
  confirmed_requirements: ConfirmedRequirement[];
  summary?: string | null;
  inspiration_ready?: boolean;
  summarized_at?: string | null;
}

export interface InspirationChoiceOption {
  description: string;
  letter?: string;
}

/** 灵感模式结构化选项，仅存在于 Agent 运行时状态（不入库） */
export interface InspirationChoices {
  hint?: string;
  options: InspirationChoiceOption[];
}

export interface GeneratedContent {
  platform: string;
  title?: string | null;
  body: string;
  hashtags?: string[];
  hook?: string | null;
  notes?: string | null;
  publish_ready?: boolean;
}

export interface YouganAgentState {
  mode: ChatMode;
  workId?: string;
  profile: WorkProfile;
  outline: WorkOutline;
  inspiration: WorkInspiration;
  inspirationChoices: InspirationChoices | null;
  creation: GeneratedContent | null;
}

export type YouganStreamValues = Partial<
  Pick<
    YouganAgentState,
    | "mode"
    | "workId"
    | "profile"
    | "outline"
    | "inspiration"
    | "inspirationChoices"
    | "creation"
  >
>;

export const EMPTY_WORK_PROFILE: WorkProfile = {
  platform: null,
  content_topic: null,
  content_type: null,
  content_points: [],
  style: null,
  tone: null,
  persona: null,
  style_constraints: [],
  audience: null,
  goals: [],
  notes: null,
  references: [],
};

export const EMPTY_WORK_OUTLINE: WorkOutline = {
  pending_changes: [],
  executed_changes: [],
  last_execution_summary: null,
  outline_summary: null,
  outline_ready: false,
};

/** @deprecated 使用 EMPTY_WORK_OUTLINE */
export const EMPTY_WORK_PLAN = EMPTY_WORK_OUTLINE;

export const EMPTY_WORK_INSPIRATION: WorkInspiration = {
  confirmed_requirements: [],
  summary: null,
  inspiration_ready: false,
  summarized_at: null,
};

export const DEFAULT_INSPIRATION_CHOICES_HINT =
  "单选：点击选项即发送；若有其他需求，可在下方对话框补充。";

export const defaultProfile = EMPTY_WORK_PROFILE;
export const defaultOutline = EMPTY_WORK_OUTLINE;
/** @deprecated 使用 defaultOutline */
export const defaultPlan = EMPTY_WORK_OUTLINE;
export const defaultInspiration = EMPTY_WORK_INSPIRATION;

export const KNOWN_PLATFORMS = [
  "xiaohongshu",
  "weibo",
  "twitter",
  "linkedin",
  "instagram",
  "wechat",
  "douyin",
  "kuaishou",
  "bilibili",
] as const;

const PLATFORM_ALIASES: Record<string, string> = {
  小红书: "xiaohongshu",
  微博: "weibo",
  推特: "twitter",
  "twitter/x": "twitter",
  x: "twitter",
  领英: "linkedin",
  instagram: "instagram",
  ins: "instagram",
  微信公众号: "wechat",
  公众号: "wechat",
  抖音: "douyin",
  快手: "kuaishou",
  bilibili: "bilibili",
  哔哩哔哩: "bilibili",
  b站: "bilibili",
};

export function normalizePlatform(platform: string): string {
  const key = platform.trim().toLowerCase();
  if ((KNOWN_PLATFORMS as readonly string[]).includes(key)) return key;
  return PLATFORM_ALIASES[key] ?? key;
}

export function newOutlineChange(description: string): OutlineChange {
  return {
    id: nanoid(12),
    description,
    created_at: new Date().toISOString(),
  };
}

/** @deprecated 使用 newOutlineChange */
export function newPlanChange(description: string) {
  return newOutlineChange(description);
}

export function newConfirmedRequirement(description: string) {
  return {
    id: nanoid(12),
    description,
    confirmed_at: new Date().toISOString(),
  };
}

/** @deprecated 使用 InspirationChoices */
export type InspirationChoicesPayload = InspirationChoices;
