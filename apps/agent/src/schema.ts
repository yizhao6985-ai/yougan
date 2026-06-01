/**
 * 全项目共享的类型、常量与工厂函数。
 *
 * 三模式流水线（模拟服务公司组织）：
 *   WorkInspiration       — 客户需求收集（灵感模式）
 *   WorkProductionPlan    — 创意总监制作计划（创作模式，存于 Work.outline 列）
 *   GeneratedContent      — 制作团队产出（创作模式）
 *   WorkProfile           — 跨模式共用的平台/风格/受众等特征
 */
import { nanoid } from "nanoid";

/** 创作模式：灵感 → 创作 → 提问 */
export const CHAT_MODES = ["inspiration", "creation", "ask"] as const;

/** {@link CHAT_MODES} 的元素类型 */
export type ChatMode = (typeof CHAT_MODES)[number];

/** 各模式在 UI / API 中的中文展示名 */
export const CHAT_MODE_LABELS: Record<ChatMode, string> = {
  inspiration: "灵感模式",
  creation: "创作模式",
  ask: "提问模式",
};

/**
 * 模式 → Work 表 JSON 列名映射。
 * ask 模式无独立 JSON 列，上下文来自 profile / inspiration / messages。
 */
export const MODE_WORK_JSON_FIELDS = {
  inspiration: "inspiration",
  ask: "inspiration",
  creation: "creation",
} as const satisfies Partial<Record<ChatMode, keyof WorkJsonFieldMap>>;

/** Work 表模式 JSON 字段的类型映射 */
export type WorkJsonFieldMap = {
  inspiration: WorkInspiration;
  outline: WorkProductionPlan;
  creation: GeneratedContent | null;
};

/** 制作团队部门 */
export type ProductionDepartment = "writing" | "design" | "audio" | "video";

export const PRODUCTION_DEPARTMENTS: ProductionDepartment[] = [
  "writing",
  "design",
  "audio",
  "video",
];

/** 用户上传或抓取的参考素材条目（写入 WorkProfile.references） */
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

/**
 * 跨模式共用的作品创作特征，对应 Work.profile。
 */
export interface WorkProfile {
  platform?: string | null;
  content_topic?: string | null;
  content_type?: string | null;
  content_format?: string | null;
  media_modality?: string | null;
  content_points?: string[];
  style?: string | null;
  tone?: string | null;
  persona?: string | null;
  audience?: string | null;
  goals?: string[];
  style_constraints?: string[];
  notes?: string | null;
  references?: ReferenceItem[];
}

/** 制作计划任务条目（创意总监制定，制作团队执行） */
export interface ProductionPlanTask {
  id: string;
  description: string;
  created_at: string;
  department?: ProductionDepartment;
  status?: "pending" | "in_progress" | "completed";
  assignee?: string | null;
}

/** 已在作品中落地的条目 */
export interface ExecutedChange {
  id: string;
  description: string;
  executed_at: string;
  batch_summary?: string | null;
  department?: ProductionDepartment;
  assignee?: string | null;
}

/**
 * 创意总监制作计划，对应 Work.outline（历史列名保留）。
 * plan_ready / plan_summary 为新字段；outline_ready / outline_summary 为兼容别名。
 */
export interface WorkProductionPlan {
  pending_changes: ProductionPlanTask[];
  executed_changes: ExecutedChange[];
  last_execution_summary?: string | null;
  /** 制作计划已定稿，制作团队可执行 */
  plan_ready?: boolean;
  plan_summary?: string | null;
  /** 创意总监选定的制作部门 */
  departments?: ProductionDepartment[];
  /** 动态加载的行业背景摘要 */
  industry_context?: string | null;
  /** 创意总监备注 */
  creative_director_notes?: string | null;
  /** @deprecated 使用 plan_ready */
  outline_ready?: boolean;
  /** @deprecated 使用 plan_summary */
  outline_summary?: string | null;
}

/** @deprecated 使用 WorkProductionPlan */
export type WorkOutline = WorkProductionPlan;

/** @deprecated 使用 ProductionPlanTask */
export type OutlineChange = ProductionPlanTask;

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

/** 灵感模式结构化建议（结构化输出节点写入，不入库） */
export interface InspirationSuggestion {
  id: string;
  kind: "explore" | "confirm" | "navigate";
  label: string;
  message: string;
}

/** 灵感模式建议列表，仅存在于 Agent 运行时状态 */
export interface InspirationSuggestions {
  hint?: string;
  suggestions: InspirationSuggestion[];
}

/** @deprecated 使用 InspirationSuggestions */
export interface InspirationChoiceOption {
  description: string;
  letter?: string;
}

/** @deprecated 使用 InspirationSuggestions */
export interface InspirationChoices {
  hint?: string;
  options: InspirationChoiceOption[];
}

/** 创作模式最终产出，对应 Work.creation */
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
  plan: WorkProductionPlan;
  inspiration: WorkInspiration;
  inspirationSuggestions: InspirationSuggestions | null;
  creation: GeneratedContent | null;
}

export type YouganStreamValues = Partial<
  Pick<
    YouganAgentState,
    | "mode"
    | "workId"
    | "profile"
    | "plan"
    | "inspiration"
    | "inspirationSuggestions"
    | "creation"
  >
>;

export const EMPTY_WORK_PROFILE: WorkProfile = {
  platform: null,
  content_topic: null,
  content_type: null,
  content_format: null,
  media_modality: null,
  content_points: [],
  style: null,
  tone: null,
  persona: null,
  audience: null,
  goals: [],
  style_constraints: [],
  notes: null,
  references: [],
};

export const EMPTY_WORK_PRODUCTION_PLAN: WorkProductionPlan = {
  pending_changes: [],
  executed_changes: [],
  last_execution_summary: null,
  plan_ready: false,
  plan_summary: null,
  departments: [],
  industry_context: null,
  creative_director_notes: null,
  outline_ready: false,
  outline_summary: null,
};

/** @deprecated 使用 EMPTY_WORK_PRODUCTION_PLAN */
export const EMPTY_WORK_OUTLINE = EMPTY_WORK_PRODUCTION_PLAN;

export const EMPTY_WORK_INSPIRATION: WorkInspiration = {
  confirmed_requirements: [],
  summary: null,
  inspiration_ready: false,
  summarized_at: null,
};

export const DEFAULT_INSPIRATION_SUGGESTIONS_HINT =
  "你可以点选建议快速回复，或在下方输入框自由补充。";

/** @deprecated 使用 DEFAULT_INSPIRATION_SUGGESTIONS_HINT */
export const DEFAULT_INSPIRATION_CHOICES_HINT =
  DEFAULT_INSPIRATION_SUGGESTIONS_HINT;

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

/** 读取 plan_ready，兼容旧 outline_ready 字段 */
export function isPlanReady(plan: WorkProductionPlan): boolean {
  return plan.plan_ready ?? plan.outline_ready ?? false;
}

/** 读取 plan_summary，兼容旧 outline_summary 字段 */
export function getPlanSummary(plan: WorkProductionPlan): string | null {
  return plan.plan_summary ?? plan.outline_summary ?? null;
}

export function newProductionPlanTask(
  description: string,
  department?: ProductionDepartment,
): ProductionPlanTask {
  return {
    id: nanoid(12),
    description,
    created_at: new Date().toISOString(),
    department,
    status: "pending",
  };
}

/** @deprecated 使用 newProductionPlanTask */
export function newOutlineChange(description: string): ProductionPlanTask {
  return newProductionPlanTask(description);
}

export function newConfirmedRequirement(
  description: string,
): ConfirmedRequirement {
  return {
    id: nanoid(12),
    description,
    confirmed_at: new Date().toISOString(),
  };
}

export function newInspirationSuggestion(
  kind: InspirationSuggestion["kind"],
  label: string,
  message: string,
): InspirationSuggestion {
  return { id: nanoid(8), kind, label, message };
}
