import type { LucideIcon } from "lucide-react";
import {
  BookOpenIcon,
  FolderKanbanIcon,
  ImageIcon,
  ListTreeIcon,
  MessageSquareTextIcon,
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

export const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "新建作品",
    body: "每件作品是一段独立创作对话，可分组管理，便于按系列或栏目组织。",
  },
  {
    step: "02",
    title: "定制作方案",
    body: "对话整理主题、体裁、表达与结构，侧栏「方案」实时同步。",
  },
  {
    step: "03",
    title: "执行制作",
    body: "方案确认后 AI 团队制定计划并制作，产出写入「作品」，可按版本继续修改。",
  },
  {
    step: "04",
    title: "提问答疑",
    body: "制作全程可提问：优化建议、方法答疑与背景知识，系统按意图处理。",
  },
] as const;

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
    icon: ImageIcon,
    title: "作品内容",
    body: "AI 团队按方案制作的文字、画面、脚本等，显示在这里。",
  },
] as const;

export const HOME_FEATURE_TEASERS = STUDIO_CAPABILITIES.map((capability) => ({
  title: capability.label,
  body: capability.teaser,
  href: `/features#${capability.anchor}`,
}));

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
