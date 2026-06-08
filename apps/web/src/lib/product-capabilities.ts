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

/** 能力页展示的创作形态示例（非平台绑定） */
export const PRODUCTION_FORMS = [
  "观点长文",
  "清单笔记",
  "案例故事",
  "教程干货",
  "对比评测",
  "脚本口播",
] as const;

export type StudioCapability = {
  anchor: string;
  icon: LucideIcon;
  /** 能力页与首页卡片上的名称 */
  label: string;
  /** 首页能力卡片摘要 */
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
    label: "作品方案",
    teaser: "整理创作主题、体裁形式与内容节拍。",
    tagline: "定作品方案",
    summary:
      "通过对话维护一份作品方案：写什么、用什么体裁、面向谁、有哪些要求与有序节拍。方案就绪后可进入制作。",
    highlights: [
      "一次对话可同时更新主题、要求与结构",
      "确认后的方案写入侧栏「作品方案」",
      "回合结束后自动生成可点选建议",
      "方案就绪后说「开始制作」进入制作",
    ],
    avoids: ["不直接写出完整正文", "不执行制作任务"],
  },
  {
    anchor: "production",
    icon: WandSparklesIcon,
    label: "制作",
    teaser: "AI 团队定计划，按计划精良制作。",
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
  },
  {
    anchor: "ask",
    icon: BookOpenIcon,
    label: "提问",
    teaser: "优化建议、创作答疑、背景知识，随时可问。",
    tagline: "有问题，随时问",
    summary:
      "问怎么做得更好给优化建议；问创作方法帮你答疑学习；问行业、受众等背景也一并作答。若要写入方案，说明意图即可。",
    highlights: [
      "优化类：怎么改、怎么提升、哪里可以更好",
      "学习类：创作技巧、结构、概念与方法答疑",
      "背景类：行业趋势、受众与表达逻辑",
      "需要落进方案时，说明后系统会帮你整理",
    ],
    avoids: ["不直接生成交付稿", "不制定制作计划"],
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
    title: "作品方案",
    body: "通过对话整理创作主题、体裁形式、表达设定与内容节拍，侧栏「作品方案」实时汇总。",
  },
  {
    step: "03",
    title: "制作 · AI 团队出稿",
    body: "方案就绪后 AI 团队制定内部制作计划，文案/设计/音视频按任务在「作品预览」精良交付，可反复修改。",
  },
  {
    step: "04",
    title: "提问 · 随时答疑",
    body: "优化建议、创作方法、行业背景——有需要随时问，系统会在对话里帮你处理。",
  },
] as const;

export const STUDIO_PANELS = [
  {
    icon: MessageSquareTextIcon,
    title: "对话区",
    body: "和 AI 聊方案、聊改稿、聊策略；回复都在这里。",
  },
  {
    icon: ListTreeIcon,
    title: "作品方案",
    body: "创作主题、写作要求与内容节拍会即时汇总在这里。",
  },
  {
    icon: ImageIcon,
    title: "作品预览",
    body: "AI 团队交付的标题、正文和标签显示在这里。",
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
    body: "按栏目或系列分组管理；也可在对话里调整分组和标题。",
  },
  {
    icon: SparklesIcon,
    title: "智能回合编排",
    body: "每条消息按你的意图自动编排：改方案、出预览或答疑，复合需求也可一步串联。",
  },
] as const;
