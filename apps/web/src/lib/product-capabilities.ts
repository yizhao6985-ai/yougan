import type { LucideIcon } from "lucide-react";
import {
  ClipboardListIcon,
  FolderKanbanIcon,
  ImageIcon,
  LightbulbIcon,
  ListChecksIcon,
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
    tagline: "没想法时，先一起找灵感",
    summary:
      "通过提问帮你定平台、选题、受众和写法，把零散想法整理成「已确认需求」。这一步不写大纲，也不生成正文。",
    highlights: [
      "每次问 1–2 个问题，帮你想清楚写什么，而不是替你做决定",
      "定期总结「目前理解是……」请你确认",
      "确认后的需求写入侧栏「灵感」",
      "方向清楚后会建议进入大纲模式",
    ],
    avoids: [
      "不直接写出完整方案或正文",
      "不写入创作大纲、不生成正文",
    ],
    shortcut: modeShortcutLabel("inspiration"),
  },
  {
    id: "outline",
    anchor: "outline",
    icon: ClipboardListIcon,
    tagline: "产出一份创作大纲",
    summary:
      "根据已确认灵感，把结构、段落、风格等整理成创作大纲；你定稿后再进入创作模式，按大纲生成标题和正文。",
    highlights: [
      "每条要点记成大纲条目",
      "主动问「还有要补充的吗？」",
      "你说「没有了」「就这些」时，列出完整大纲请你定稿",
      "定稿后生成大纲摘要，再引导进入创作模式",
    ],
    avoids: [
      "大纲未定稿前不生成正文",
      "不用催促话术，等你确认后再出稿",
    ],
    shortcut: modeShortcutLabel("outline"),
  },
  {
    id: "creation",
    anchor: "creation",
    icon: WandSparklesIcon,
    tagline: "按大纲完成最终实现",
    summary:
      "针对已定稿的创作大纲生成与修改标题、正文；你的调整先记入待执行项，执行后总结改了什么。",
    highlights: [
      "严格按创作大纲出稿，不跳过已定结构",
      "支持标题、正文与话题标签",
      "每次执行都有摘要，方便对比版本",
      "可随时回到灵感或大纲模式调整方向",
    ],
    avoids: [
      "不跳过记录修改直接生成",
      "大纲未定稿时不应在此模式出稿",
    ],
    shortcut: modeShortcutLabel("creation"),
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
    title: "灵感模式 · 定选题",
    body: "用对话确认平台、选题、受众、语气等，侧栏「灵感」展示已确认需求。",
  },
  {
    step: "03",
    title: "大纲模式 · 写大纲",
    body: "把结构、段落、风格要求等写成创作大纲；确认无补充后定稿。",
  },
  {
    step: "04",
    title: "创作模式 · 按大纲出稿",
    body: "按已定稿大纲在「内容预览」生成标题和正文，可反复修改。",
  },
] as const;

export const STUDIO_PANELS = [
  {
    icon: MessageSquareTextIcon,
    title: "对话区",
    body: "和 AI 聊选题、聊大纲、聊修改；回复都在这里。",
  },
  {
    icon: LightbulbIcon,
    title: "灵感",
    body: "灵感模式确认的需求会即时汇总在这里，作为大纲模式的输入依据。",
  },
  {
    icon: ListChecksIcon,
    title: "创作大纲",
    body: "大纲模式撰写并定稿；创作模式按大纲执行并记录已实现项。",
  },
  {
    icon: ImageIcon,
    title: "内容预览",
    body: "创作模式按大纲生成后，在此预览标题、正文和标签。",
  },
] as const;

const HOME_TEASER_BODIES: Record<ChatMode, string> = {
  inspiration: "没选题时一起找灵感，定平台、受众和写法。",
  outline: "产出创作大纲，定稿后再出稿。",
  creation: "按大纲生成标题和正文。",
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
