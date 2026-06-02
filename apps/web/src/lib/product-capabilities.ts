import type { LucideIcon } from "lucide-react";
import {
  BookOpenIcon,
  FolderKanbanIcon,
  ImageIcon,
  LightbulbIcon,
  ListTreeIcon,
  MessageSquareTextIcon,
  SparklesIcon,
  WandSparklesIcon,
} from "lucide-react";

import type { ChatMode } from "@/lib/types";
import { CHAT_MODE_LABELS } from "@/lib/types";
import { modeShortcutLabel } from "@/lib/chat-mode-config";

export const SUPPORTED_PLATFORMS = [
  "小红书",
  "微博",
  "微信公众号",
  "抖音",
  "快手",
  "哔哩哔哩",
] as const;

export type CapabilityMode = {
  id: ChatMode;
  anchor: string;
  icon: LucideIcon;
  tagline: string;
  summary: string;
  highlights: string[];
  avoids: string[];
  shortcut: string;
};

export const CREATION_MODES: CapabilityMode[] = [
  {
    id: "inspiration",
    anchor: "inspiration",
    icon: LightbulbIcon,
    tagline: "找灵感、定方向",
    summary:
      "通过提问帮你找灵感，理清平台、选题、受众和写法，把零散想法整理成「已确认灵感」。每轮对话结束会给出可点选建议。",
    highlights: [
      "每次问 1–2 个问题，帮你想清楚写什么",
      "确认后的灵感写入侧栏「灵感」",
      "回合结束后自动生成可点选建议",
      "方向清楚后可进入大纲或提问模式",
    ],
    avoids: ["不直接写出完整方案或正文", "不编辑内容大纲", "不执行制作任务"],
    shortcut: modeShortcutLabel("inspiration"),
  },
  {
    id: "outline",
    anchor: "outline",
    icon: ListTreeIcon,
    tagline: "确认内容结构",
    summary:
      "brief 定稿后进入大纲模式，与 AI 一起确认章节、段落要点与叙事顺序，定稿后再进入创作。",
    highlights: [
      "自动生成初版大纲，可在侧栏与对话中修改",
      "条目描述内容结构，不是制作任务",
      "确认定稿后进入创作模式",
      "回合结束后给出可点选建议",
    ],
    avoids: ["不收集 brief 需求", "不出稿、不执行制作计划"],
    shortcut: modeShortcutLabel("outline"),
  },
  {
    id: "creation",
    anchor: "creation",
    icon: WandSparklesIcon,
    tagline: "AI 团队精良制作",
    summary:
      "AI 团队制定制作计划，文案/设计/音频/视频按计划执行，精良生成与修改标题、正文等内容。",
    highlights: [
      "自动制定制作计划",
      "按部门调度专员（文案、设计、音频、视频）",
      "动态加载行业经验提示词",
      "每次执行都有摘要，方便对比版本",
    ],
    avoids: ["不跳过任务记录直接生成"],
    shortcut: modeShortcutLabel("creation"),
  },
  {
    id: "ask",
    anchor: "ask",
    icon: BookOpenIcon,
    tagline: "有问题，随时问",
    summary:
      "本质是提问模式：问怎么做得更好给优化建议；问创作方法帮你答疑学习；问行业、平台、受众等背景也一并作答。",
    highlights: [
      "优化类：怎么改、怎么提升、哪里可以更好",
      "学习类：创作技巧、结构、概念与方法答疑",
      "背景类：行业趋势、平台差异、受众与转化逻辑",
      "重要结论可记入灵感",
    ],
    avoids: ["不直接生成交付稿", "不制定制作计划"],
    shortcut: modeShortcutLabel("ask"),
  },
];

export const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "新建作品",
    body: "每件作品是一段独立创作对话，可分组管理，方便按栏目或系列组织内容。",
  },
  {
    step: "02",
    title: "灵感模式 · 找灵感",
    body: "通过对话帮你找灵感，确认平台、选题、受众、语气等，侧栏「灵感」汇总已确认内容。",
  },
  {
    step: "03",
    title: "大纲模式 · 确认结构",
    body: "brief 定稿后自动生成大纲；在大纲模式里确认章节与叙事顺序，定稿后进入创作。",
  },
  {
    step: "04",
    title: "创作模式 · AI 团队出稿",
    body: "AI 团队制定内部制作计划，文案/设计/音视频按任务在「内容预览」精良交付，可反复修改。",
  },
  {
    step: "05",
    title: "提问模式 · 随时答疑",
    body: "优化建议、创作方法、行业与平台背景——按问题类型作答，重要结论可记入灵感（任意时刻可切换）。",
  },
] as const;

export const STUDIO_PANELS = [
  {
    icon: MessageSquareTextIcon,
    title: "对话区",
    body: "和 AI 聊灵感、聊策略、聊修改；回复都在这里。",
  },
  {
    icon: LightbulbIcon,
    title: "灵感",
    body: "灵感模式确认的灵感会即时汇总在这里。",
  },
  {
    icon: ImageIcon,
    title: "内容预览",
    body: "AI 团队交付的标题、正文和标签显示在这里。",
  },
] as const;

const HOME_TEASER_BODIES: Record<ChatMode, string> = {
  inspiration: "帮你找灵感，理清平台、选题与写法。",
  outline: "确认章节结构与叙事顺序。",
  creation: "AI 团队定计划，按计划精良制作。",
  ask: "优化建议、创作答疑、行业背景，随时可问。",
};

export const HOME_FEATURE_TEASERS = CREATION_MODES.map((mode) => ({
  title: CHAT_MODE_LABELS[mode.id],
  body: HOME_TEASER_BODIES[mode.id],
  href: `/features#${mode.anchor}`,
}));

export const EXTRA_CAPABILITIES = [
  {
    icon: FolderKanbanIcon,
    title: "作品分组",
    body: "按栏目或系列分组管理；也可在对话里调整分组和标题。",
  },
  {
    icon: SparklesIcon,
    title: "模式随时切换",
    body: "界面、快捷键或对话指令都可切换；切换后 AI 和侧栏即时对齐。",
  },
] as const;
