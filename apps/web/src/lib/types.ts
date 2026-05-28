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

export interface OutlineChange {
  id: string;
  description: string;
  created_at: string;
}

/** @deprecated 使用 OutlineChange */
export type PlanChange = OutlineChange;

export interface ExecutedChange {
  id: string;
  description: string;
  executed_at: string;
  batch_summary?: string | null;
}

export interface WorkOutline {
  pending_changes: OutlineChange[];
  executed_changes: ExecutedChange[];
  last_execution_summary?: string | null;
  outline_summary?: string | null;
  outline_ready?: boolean;
}

/** @deprecated 使用 WorkOutline */
export type WorkPlan = WorkOutline;

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

export interface InspirationChoiceOption {
  description: string;
  letter?: string;
}

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
  outline?: WorkOutline;
  inspiration?: WorkInspiration;
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
  mode: ChatMode;
  threadId: string | null;
  profile: WorkProfile;
  outline: WorkOutline;
  inspiration: WorkInspiration;
  creation: GeneratedContent | null;
  createdAt: string;
  updatedAt: string;
}

export interface YouganValues extends YouganStreamValues, Record<string, unknown> {}

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

/** @deprecated 使用 InspirationChoices */
export type InspirationChoicesPayload = InspirationChoices;
