/** 创作模式：灵感（需求）· 创作（计划与交付）· 提问 */
export const CHAT_MODES = ["inspiration", "creation", "ask"] as const;

export type ChatMode = (typeof CHAT_MODES)[number];

export const CHAT_MODE_LABELS: Record<ChatMode, string> = {
  inspiration: "灵感模式",
  creation: "创作模式",
  ask: "提问模式",
};

/** @deprecated 兼容旧数据 */
export const LEGACY_CHAT_MODES = ["outline", "advice"] as const;

export function normalizeChatMode(mode: string): ChatMode {
  if (mode === "outline") return "creation";
  if (mode === "advice") return "ask";
  if ((CHAT_MODES as readonly string[]).includes(mode)) return mode as ChatMode;
  return "inspiration";
}

export const MODE_WORK_JSON_FIELDS = {
  inspiration: "inspiration",
  ask: "inspiration",
  creation: "creation",
} as const;

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

export type ProductionDepartment = "writing" | "design" | "audio" | "video";

export interface ProductionPlanTask {
  id: string;
  description: string;
  created_at: string;
  department?: ProductionDepartment;
  status?: "pending" | "in_progress" | "completed";
  assignee?: string | null;
}

export interface ExecutedChange {
  id: string;
  description: string;
  executed_at: string;
  batch_summary?: string | null;
  department?: ProductionDepartment;
  assignee?: string | null;
}

/** 创意总监制作计划（存于 Work.outline 列） */
export interface WorkProductionPlan {
  pending_changes: ProductionPlanTask[];
  executed_changes: ExecutedChange[];
  last_execution_summary?: string | null;
  plan_ready?: boolean;
  plan_summary?: string | null;
  departments?: ProductionDepartment[];
  industry_context?: string | null;
  creative_director_notes?: string | null;
  /** @deprecated */
  outline_ready?: boolean;
  /** @deprecated */
  outline_summary?: string | null;
}

/** @deprecated 使用 WorkProductionPlan */
export type WorkOutline = WorkProductionPlan;

/** @deprecated */
export type OutlineChange = ProductionPlanTask;

export function isPlanReady(plan?: WorkProductionPlan): boolean {
  if (!plan) return false;
  return plan.plan_ready ?? plan.outline_ready ?? false;
}

export function getPlanSummary(plan?: WorkProductionPlan): string | null {
  if (!plan) return null;
  return plan.plan_summary ?? plan.outline_summary ?? null;
}

export interface ConfirmedRequirement {
  id: string;
  description: string;
  confirmed_at: string;
}

export interface WorkInspiration {
  confirmed_requirements: ConfirmedRequirement[];
  summary?: string | null;
  inspiration_ready?: boolean;
  summarized_at?: string | null;
}

export interface InspirationSuggestion {
  id: string;
  kind: "explore" | "confirm" | "navigate";
  label: string;
  message: string;
}

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

export interface GeneratedContent {
  platform: string;
  title?: string | null;
  body: string;
  hashtags?: string[];
  hook?: string | null;
  notes?: string | null;
  publish_ready?: boolean;
}

export interface YouganStreamValues {
  mode?: ChatMode;
  workId?: string;
  profile?: WorkProfile;
  plan?: WorkProductionPlan;
  /** @deprecated graph 已改用 plan；兼容旧 checkpoint / 流 */
  outline?: WorkProductionPlan;
  inspiration?: WorkInspiration;
  inspirationSuggestions?: InspirationSuggestions | null;
  /** @deprecated */
  inspirationChoices?: InspirationChoices | null;
  creation?: GeneratedContent | null;
  modelTemperature?: number;
}

export interface WorkGroup {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Work {
  id: string;
  title: string;
  groupId: string | null;
  profile: WorkProfile;
  outline: WorkProductionPlan;
  inspiration: WorkInspiration;
  creation: GeneratedContent | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkConversation {
  id: string;
  workId: string;
  title: string;
  mode: ChatMode;
  threadId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface YouganValues extends YouganStreamValues, Record<string, unknown> {}

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

/** @deprecated */
export const EMPTY_WORK_OUTLINE = EMPTY_WORK_PRODUCTION_PLAN;

export const EMPTY_WORK_INSPIRATION: WorkInspiration = {
  confirmed_requirements: [],
  summary: null,
  inspiration_ready: false,
  summarized_at: null,
};

export const DEFAULT_INSPIRATION_SUGGESTIONS_HINT =
  "你可以点选建议快速回复，或在下方输入框自由补充。";

/** @deprecated */
export const DEFAULT_INSPIRATION_CHOICES_HINT = DEFAULT_INSPIRATION_SUGGESTIONS_HINT;
