import type { LucideIcon } from "lucide-react";
import {
  BookOpenIcon,
  FolderKanbanIcon,
  GitBranchIcon,
  HistoryIcon,
  ImageIcon,
  ListTreeIcon,
  MessageSquareTextIcon,
  ScanSearchIcon,
  SparklesIcon,
  WandSparklesIcon,
} from "lucide-react";

/** 能力页展示的创作形态示例 */
export const PRODUCTION_FORMS = [
  "观点长文",
  "清单笔记",
  "案例故事",
  "教程干货",
  "对比评测",
  "脚本口播",
  "插画绘画",
  "短视频脚本",
] as const;

export type StudioCapability = {
  anchor: string;
  icon: LucideIcon;
  label: string;
  teaser: string;
  tagline: string;
  summary: string;
  highlights: string[];
  avoids: string[];
};

export const STUDIO_CAPABILITIES: StudioCapability[] = [
  {
    anchor: "profile",
    icon: ListTreeIcon,
    label: "定方案",
    teaser: "整理主题、体裁、表达与结构。",
    tagline: "制作方案",
    summary:
      "通过对话维护制作方案：做什么、什么形式、面向谁、有哪些要求与内容结构。方案确认后进入制作环节。",
    highlights: [
      "一次对话可更新主题、要求与结构",
      "确认后的方案写入侧栏「方案」",
      "每轮结束提供可执行的下一步建议",
      "方案就绪后说「开始制作」进入制作",
    ],
    avoids: ["不直接产出作品内容", "不执行制作任务"],
  },
  {
    anchor: "reference",
    icon: ScanSearchIcon,
    label: "素材解析",
    teaser: "上传并分析参考素材，记录借鉴意图。",
    tagline: "参考素材",
    summary:
      "上传文本、图片、音视频等参考素材，系统自动分析内容与可借鉴要点，并记录借鉴意图，汇总在侧栏「参考」面板，供定方案与制作时引用。",
    highlights: [
      "支持文本、图片、音频、视频等多种参考形态",
      "对话附带附件时自动触发分析",
      "分析结果与借鉴意图写入「参考」面板",
      "可在侧栏直接维护参考素材列表",
    ],
    avoids: ["不直接修改制作方案", "不产出作品内容"],
  },
  {
    anchor: "production",
    icon: WandSparklesIcon,
    label: "制作",
    teaser: "AI 团队排计划，按方案执行。",
    tagline: "执行制作",
    summary:
      "AI 团队制定制作计划并按步骤执行，覆盖文字、视觉、音频、视频等形态，产出作品内容并可反复修改。",
    highlights: [
      "自动制定制作计划",
      "按专长分配文字、视觉、音频、视频任务",
      "按体裁与媒介选用制作指引",
      "每次执行有记录，便于版本对比",
    ],
    avoids: ["不跳过任务记录直接生成"],
  },
  {
    anchor: "ask",
    icon: BookOpenIcon,
    label: "提问",
    teaser: "制作过程中的优化与答疑。",
    tagline: "提问答疑",
    summary:
      "询问优化方向、创作方法与背景知识；需要写入方案时，说明意图即可由系统整理进制作方案。",
    highlights: [
      "优化：如何改进作品或方案",
      "学习：创作技巧、结构与概念",
      "背景：受众、表达与参考方向",
      "需写入方案时，说明后自动整理",
    ],
    avoids: ["不直接产出作品内容", "不制定制作计划"],
  },
];

export const STUDIO_PANELS = [
  {
    icon: MessageSquareTextIcon,
    title: "对话区",
    body: "推进方案、发起制作、提问答疑，回复集中在这里。",
  },
  {
    icon: ListTreeIcon,
    title: "制作方案",
    body: "主题、要求与内容结构，确认后实时汇总。",
  },
  {
    icon: ScanSearchIcon,
    title: "参考素材",
    body: "上传的参考经分析后汇总在这里，含内容与借鉴意图。",
  },
  {
    icon: ImageIcon,
    title: "作品内容",
    body: "AI 团队按方案制作的文字、画面、脚本等，显示在这里。",
  },
  {
    icon: HistoryIcon,
    title: "版本记录",
    body: "每次产出作品内容记一版，可回溯对比或分叉探索。",
  },
] as const;

/** 能力页 · 作品迭代（版本 / 分叉） */
export const FEATURES_LIFECYCLE_CAPABILITIES: StudioCapability[] = [
  {
    anchor: "versions",
    icon: HistoryIcon,
    label: "版本记录",
    teaser: "成稿里程碑自动记版，可回溯对比。",
    tagline: "版本历史",
    summary:
      "每次产出作品内容时追加一个版本节点，记录该时刻的方案、参考与成稿快照。可随时回到历史版本，或以此为起点分叉探索。",
    highlights: [
      "仅作品预览里程碑写入时间轴",
      "方案与参考的 interim 修改不单独占版",
      "支持恢复到任一历史成稿状态",
      "便于对比不同阶段的成稿差异",
    ],
    avoids: ["不记录无成稿的方案修改"],
  },
  {
    anchor: "fork",
    icon: GitBranchIcon,
    label: "作品分叉",
    teaser: "另存或从历史版本分叉，探索新方向。",
    tagline: "平行探索",
    summary:
      "想换选题或换方向时，可从当前进度另存为新作品，或从历史某一版分叉——新作品继承该版快照，原作路线不受影响。",
    highlights: [
      "另存为新作品：复制当前进度，不带走版本历史",
      "从版本分叉：继承该版出稿时的完整状态",
      "记录来源作品与版本，便于追溯",
      "适合平行尝试不同体裁或表达",
    ],
    avoids: ["不修改原作品的版本时间轴"],
  },
];

export const HOME_FEATURE_TEASERS = STUDIO_CAPABILITIES.map((capability) => ({
  title: capability.label,
  body: capability.teaser,
  href: `/features#${capability.anchor}`,
}));

/** 首页 · 创作核心能力（含素材解析） */
export const HOME_CREATION_WORKFLOW = [
  {
    icon: ListTreeIcon,
    title: "定方案",
    body: "整理主题、体裁、表达与结构，确认后再进入制作。",
    href: "/features#profile",
  },
  {
    icon: ScanSearchIcon,
    title: "素材解析",
    body: "上传文本、图片、音视频等参考，自动分析内容与可借鉴要点，汇总到「参考」面板。",
    href: "/features#reference",
  },
  {
    icon: WandSparklesIcon,
    title: "制作",
    body: "AI 团队排计划，按方案执行文字、画面、脚本与音视频制作。",
    href: "/features#production",
  },
  {
    icon: BookOpenIcon,
    title: "提问",
    body: "制作过程中的优化建议、方法答疑与背景知识，随时发问。",
    href: "/features#ask",
  },
] as const;

/** 首页 · 创作迭代（版本 / 分叉） */
export const HOME_CREATION_LIFECYCLE = [
  {
    icon: HistoryIcon,
    title: "版本记录",
    body: "每次产出作品内容自动记一版，可对比回溯，回到任一历史成稿时的完整状态。",
    href: "/features#versions",
  },
  {
    icon: GitBranchIcon,
    title: "作品分叉",
    body: "想换选题或换方向？另存为新作品，或从历史某一版分叉探索，原作路线不受影响。",
    href: "/features#fork",
  },
] as const;

/** 能力页锚点导航 */
export const FEATURES_ANCHOR_LINKS = [
  { href: "#profile", label: "定方案" },
  { href: "#reference", label: "素材解析" },
  { href: "#production", label: "制作" },
  { href: "#ask", label: "提问" },
  { href: "#versions", label: "版本" },
  { href: "#fork", label: "分叉" },
  { href: "#studio-heading", label: "创作台" },
  { href: "#platform-heading", label: "平台" },
  { href: "#assistant-heading", label: "助手" },
] as const;

/** 首页 · 内容平台要点 */
export const HOME_PLATFORM_HIGHLIGHTS = [
  "一键发布到有感公域",
  "浏览创作者公开分享的混排作品",
  "个人主页沉淀已发布作品集",
] as const;

export const EXTRA_CAPABILITIES = [
  {
    icon: FolderKanbanIcon,
    title: "作品分组",
    body: "按栏目或系列分组；也可在对话中调整分组与标题。",
  },
  {
    icon: SparklesIcon,
    title: "智能回合",
    body: "每条消息自动路由：更新方案、执行制作或答疑，复合需求可串联处理。",
  },
] as const;
