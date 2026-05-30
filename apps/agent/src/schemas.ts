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

/** {@link CHAT_MODES} 的元素类型 */
export type ChatMode = (typeof CHAT_MODES)[number];

/** 各模式在 UI / API 中的中文展示名 */
export const CHAT_MODE_LABELS: Record<ChatMode, string> = {
  inspiration: "灵感模式",
  outline: "大纲模式",
  creation: "创作模式",
};

/**
 * 模式 → Work 表 JSON 列名映射。
 * 用于 syncFromStream / API 按当前 mode 读写对应字段。
 */
export const MODE_WORK_JSON_FIELDS = {
  inspiration: "inspiration",
  outline: "outline",
  creation: "creation",
} as const satisfies Record<ChatMode, keyof WorkJsonFieldMap>;

/** Work 表三个模式 JSON 字段的类型映射 */
export type WorkJsonFieldMap = {
  inspiration: WorkInspiration;
  outline: WorkOutline;
  creation: GeneratedContent | null;
};

/** 用户上传或抓取的参考素材条目（写入 WorkProfile.references） */
export interface ReferenceItem {
  /** 素材来源：纯文本、图片或网页 */
  source_type: "text" | "image" | "web";
  /** 模型可用的浓缩摘要 */
  summary: string;
  keywords?: string[];
  tone_hints?: string[];
  structure_hints?: string[];
  hashtags?: string[];
  /** 原文摘录，过长时截断 */
  raw_excerpt?: string | null;
  image_url?: string | null;
  url?: string | null;
  title?: string | null;
}

/**
 * 跨模式共用的作品创作特征，对应 Work.profile。
 * 灵感/大纲/创作工具均可通过 update_work_profile 增量更新。
 */
export interface WorkProfile {
  // —— 发布与内容定位 ——
  /** 目标发布平台 slug（经 {@link normalizePlatform} 规范化，如 xiaohongshu） */
  platform?: string | null;
  /** 创作主题：这篇内容主要讲什么 */
  content_topic?: string | null;
  /** 内容类型的自由文本描述（与结构化体裁互补） */
  content_type?: string | null;
  /** 结构化体裁 id，与 discover contentFormat 对齐（如笔记、长文） */
  content_format?: string | null;
  /** 结构化媒介形式 id，与 discover mediaType 对齐（如图文、视频） */
  media_modality?: string | null;
  /** 必须覆盖的内容要点，每条一条 bullet */
  content_points?: string[];
  // —— 表达与人设 ——
  /** 整体文风 / 表达方式（如干货、故事化） */
  style?: string | null;
  /** 语气（如正式、轻松、犀利） */
  tone?: string | null;
  /** 发文人设或身份定位（如职场博主、品牌官方） */
  persona?: string | null;
  // —— 受众与目标 ——
  /** 目标受众描述 */
  audience?: string | null;
  /** 创作目标（如涨粉、转化、品牌曝光） */
  goals?: string[];
  // —— 约束与补充 ——
  /** 必须遵守的风格约束（禁忌词、篇幅、格式等） */
  style_constraints?: string[];
  /** 用户或 Agent 补充的自由备注 */
  notes?: string | null;
  // —— 参考素材 ——
  /** 参考素材列表（文本/图片/网页解析结果） */
  references?: ReferenceItem[];
}

/** 待实现 / 待执行的大纲条目（大纲模式撰写，创作模式消费） */
export interface OutlineChange {
  id: string;
  description: string;
  created_at: string;
}

/** 已在作品中落地的条目（创作 complete_execution 或灵感对照同步写入） */
export interface ExecutedChange {
  id: string;
  description: string;
  executed_at: string;
  /** 本批次落地时的摘要说明 */
  batch_summary?: string | null;
}

/** 大纲模式状态，对应 Work.outline */
export interface WorkOutline {
  pending_changes: OutlineChange[];
  executed_changes: ExecutedChange[];
  last_execution_summary?: string | null;
  outline_summary?: string | null;
  /** 大纲已定稿，可进入创作模式 */
  outline_ready?: boolean;
}

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
  /** 灵感已汇总定稿，可进入大纲模式 */
  inspiration_ready?: boolean;
  summarized_at?: string | null;
}

/** 灵感模式单条结构化选项（A/B/C 等） */
export interface InspirationChoiceOption {
  description: string;
  /** 展示用字母标签，如 A、B、C */
  letter?: string;
}

/** 灵感模式结构化选项，仅存在于 Agent 运行时状态（不入库） */
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
  /** 内容可发布，前端可展示发布相关 UI */
  publish_ready?: boolean;
}

/**
 * Agent 图对外暴露的状态切片（不含 messages 等运行时字段）。
 * 与 {@link AgentState} 中持久化相关字段对齐，供 API 类型与流式 values 使用。
 */
export interface YouganAgentState {
  mode: ChatMode;
  workId?: string;
  profile: WorkProfile;
  outline: WorkOutline;
  inspiration: WorkInspiration;
  inspirationChoices: InspirationChoices | null;
  creation: GeneratedContent | null;
}

/**
 * LangGraph stream `values` 事件的部分更新载荷。
 * 各字段可选，未出现的字段表示本回合不覆盖。
 */
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

/**
 * 空 profile，作为 reducer 默认值与 parseProfile 回退。
 * 字段顺序与 {@link WorkProfile} 一致：发布定位 → 表达人设 → 受众目标 → 约束备注 → 参考素材。
 */
export const EMPTY_WORK_PROFILE: WorkProfile = {
  // 发布与内容定位
  platform: null,
  content_topic: null,
  content_type: null,
  content_format: null,
  media_modality: null,
  content_points: [],
  // 表达与人设
  style: null,
  tone: null,
  persona: null,
  // 受众与目标
  audience: null,
  goals: [],
  // 约束与补充
  style_constraints: [],
  notes: null,
  // 参考素材
  references: [],
};

/** 空大纲状态 */
export const EMPTY_WORK_OUTLINE: WorkOutline = {
  pending_changes: [],
  executed_changes: [],
  last_execution_summary: null,
  outline_summary: null,
  outline_ready: false,
};

/** 空灵感状态 */
export const EMPTY_WORK_INSPIRATION: WorkInspiration = {
  confirmed_requirements: [],
  summary: null,
  inspiration_ready: false,
  summarized_at: null,
};

/** 灵感结构化选项默认提示文案 */
export const DEFAULT_INSPIRATION_CHOICES_HINT =
  "单选：点击选项即发送；若有其他需求，可在下方对话框补充。";

/** 系统识别的平台 slug 白名单 */
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

/** 中文/别名 → slug，供 {@link normalizePlatform} 查找 */
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

/**
 * 将用户输入的平台名规范为 slug。
 * 已在 {@link KNOWN_PLATFORMS} 中则原样返回小写；否则查别名表，无匹配则返回 trim 后小写原文。
 */
export function normalizePlatform(platform: string): string {
  const key = platform.trim().toLowerCase();
  if ((KNOWN_PLATFORMS as readonly string[]).includes(key)) return key;
  return PLATFORM_ALIASES[key] ?? key;
}

/** 创建一条待执行大纲条目（自动生成 id 与 created_at） */
export function newOutlineChange(description: string): OutlineChange {
  return {
    id: nanoid(12),
    description,
    created_at: new Date().toISOString(),
  };
}

/** 创建一条已确认灵感（自动生成 id 与 confirmed_at） */
export function newConfirmedRequirement(
  description: string,
): ConfirmedRequirement {
  return {
    id: nanoid(12),
    description,
    confirmed_at: new Date().toISOString(),
  };
}
