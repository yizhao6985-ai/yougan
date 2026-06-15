import type { ContentFormatId, MediaModalityId } from "../../models/taxonomy/content.js";
import type { ProfileSetupStep, WorkProfile } from "../../models/work/profile.js";
import { inferMediaModalities } from "../media-modalities.js";
import { parseProfileJson } from "./profile.js";

export type ProfileStepCopy = {
  title: string;
  hint: string;
  emptyTitle: string;
  emptyBody: string;
  placeholder: string;
  /** 供 suggestions LLM 参考的示例方向（非逐字输出） */
  suggestionExamples: string[];
};

type StepCopyVariant = Omit<ProfileStepCopy, "suggestionExamples"> & {
  suggestionExamples?: string[];
};

const DEFAULT_EXAMPLES: Record<
  Exclude<ProfileSetupStep, "ready">,
  string[]
> = {
  intent: [
    "分享三款适合夏天的平价防晒霜",
    "一组赛博朋克城市夜景插画",
    "60 秒咖啡店探店短视频",
    "30 分钟创业者访谈播客",
  ],
  delivery: [
    "小红书图文笔记，3 图配文",
    "竖屏 60 秒短视频，快节奏口播",
    "4 张 16:9 概念插画",
    "15 分钟单口播客",
  ],
  expression: [
    "面向职场新人，语气轻松",
    "画面偏简约，主色蓝白",
    "口播亲切、像朋友聊天",
    "高饱和霓虹，电影感构图",
  ],
  structure: [
    "开头用痛点引入，中间对比三款，结尾给购买建议",
    "主角是刚入行的产品经理",
    "分镜：门头特写 → 产品展示 → 口播总结",
    "第一段钩子，第二段展开，第三段行动号召",
  ],
  constraints: [
    "不要出现真实品牌名",
    "必须提到 SPF50",
    "避免血腥暴力画面",
    "总时长不超过 90 秒",
  ],
};

const FORMAT_INTENT: Partial<Record<ContentFormatId, StepCopyVariant>> = {
  illustration: {
    title: "画面主题",
    hint: "这套作品要表达什么、围绕什么对象或场景",
    emptyTitle: "还没定画面主题",
    emptyBody: "在对话里说，例如：「一组赛博朋克城市插画，霓虹夜景为主」",
    placeholder: "说说画面主题，例如：四季更替的城市天际线系列插画…",
  },
  short_video: {
    title: "视频选题",
    hint: "这条视频讲什么、钩子是什么",
    emptyTitle: "还没定视频选题",
    emptyBody: "在对话里说，例如：「60 秒探店 vlog，突出性价比」",
    placeholder: "说说视频选题，例如：周末居家收纳改造短视频…",
  },
  video_script: {
    title: "脚本选题",
    hint: "这支片子要拍什么、核心信息是什么",
    emptyTitle: "还没定脚本方向",
    emptyBody: "在对话里说，例如：「产品功能演示片，30 秒，三幕结构」",
    placeholder: "说说脚本方向，例如：品牌年度回顾短片脚本…",
  },
  podcast: {
    title: "节目主题",
    hint: "这期播客聊什么、给谁听",
    emptyTitle: "还没定节目主题",
    emptyBody: "在对话里说，例如：「独立开发者聊副业转型，45 分钟」",
    placeholder: "说说节目主题，例如：设计师谈 AI 工具如何改变工作流…",
  },
  music: {
    title: "作品主题",
    hint: "这段音频的情绪、场景或叙事",
    emptyTitle: "还没定音频主题",
    emptyBody: "在对话里说，例如：「轻电子氛围曲，适合专注工作」",
    placeholder: "说说音频主题，例如：治愈系钢琴曲，适合睡前放松…",
  },
};

const DEFAULT_STEP_COPY: Record<
  Exclude<ProfileSetupStep, "ready">,
  StepCopyVariant
> = {
  intent: {
    title: "创作定位",
    hint: "确定作品要做什么、围绕什么主题，是后续各步的总纲",
    emptyTitle: "还没定创作方向",
    emptyBody:
      "在对话里说，例如：「分享三款适合夏天的平价防晒霜」或「一组赛博朋克城市插画」",
    placeholder: "说说创作方向，例如：职场新人效率工具测评…",
  },
  delivery: {
    title: "体裁与参数",
    hint: "选定交付形态（图文、视频、插画等）、发布平台与字数/画幅/时长等参数",
    emptyTitle: "还没定体裁",
    emptyBody:
      "在对话里说，例如：「小红书图文笔记」或「竖屏 60 秒短视频，时长约 1 分钟」",
    placeholder: "说说体裁与参数，例如：小红书图文、竖屏短视频 60 秒…",
  },
  expression: {
    title: "表达设定",
    hint: "说明写给谁看、文字语气与画面/氛围方向，统一全片风格",
    emptyTitle: "还没定表达风格",
    emptyBody:
      "在对话里说，例如：「面向职场新人，语气轻松」或「画面偏简约、主色蓝色」",
    placeholder: "说说受众与表达风格，例如：面向学生党，口语化、节奏快…",
  },
  structure: {
    title: "结构与要素",
    hint: "补充固定设定（人物、背景等）与内容结构（段落、分镜、章节顺序）",
    emptyTitle: "暂无结构与要素",
    emptyBody:
      "可选。需要可说：「主角是刚入行的产品经理」或「开头钩子，中间对比，结尾号召」",
    placeholder: "说说结构或关键要素，例如：三幕结构，第二幕对比竞品…",
  },
  constraints: {
    title: "创作规则",
    hint: "列出必须遵守或需要避免的事项，减少制作返工",
    emptyTitle: "暂无特殊要求",
    emptyBody:
      "可选。需要可说：「不要出现真实品牌名」或「必须提到 SPF50」",
    placeholder: "说说限制或必含要素，例如：不出现竞品名、必须标注数据来源…",
  },
};

const STRUCTURE_SEGMENTS_LABEL: Partial<Record<ContentFormatId, string>> = {
  illustration: "构图与画面结构",
  short_video: "分镜大纲",
  video_script: "分镜大纲",
  podcast: "章节大纲",
  music: "段落结构",
  novel: "章节大纲",
  article: "段落大纲",
  blog: "段落大纲",
  note: "段落大纲",
  short_post: "段落大纲",
};

function resolveFormat(profile: WorkProfile): ContentFormatId | null {
  return profile.delivery.format;
}

function resolveModalities(profile: WorkProfile): MediaModalityId[] {
  const format = profile.delivery.format;
  if (profile.delivery.modalities?.length) {
    return profile.delivery.modalities;
  }
  if (format) {
    return inferMediaModalities({ contentFormat: format });
  }
  return [];
}

function mergeStepCopy(
  step: Exclude<ProfileSetupStep, "ready">,
  variant?: Partial<StepCopyVariant>,
): ProfileStepCopy {
  const base = variant ?? DEFAULT_STEP_COPY[step];
  return {
    ...DEFAULT_STEP_COPY[step],
    ...base,
    suggestionExamples:
      base.suggestionExamples ?? DEFAULT_EXAMPLES[step],
  };
}

/** 按体裁与步骤返回展示文案（web / agent 共用） */
export function getProfileStepCopy(
  raw: WorkProfile | undefined,
  step: ProfileSetupStep,
): ProfileStepCopy {
  if (step === "ready") {
    return {
      title: "方案就绪",
      hint: "必填项已齐，确认后可说「开始制作」进入 AI 制作；也可继续补充可选步骤",
      emptyTitle: "",
      emptyBody: "",
      placeholder: "说「开始制作」，或继续补充方案细节…",
      suggestionExamples: ["开始制作", "先补充表达风格再制作"],
    };
  }

  const profile = parseProfileJson(raw);
  const format = resolveFormat(profile);

  if (step === "intent" && format && FORMAT_INTENT[format]) {
    return mergeStepCopy("intent", FORMAT_INTENT[format]);
  }

  if (step === "structure" && format) {
    const segmentLabel = STRUCTURE_SEGMENTS_LABEL[format] ?? "结构大纲";
    return mergeStepCopy("structure", {
      title: "结构与要素",
      hint: `固定设定与${segmentLabel}`,
      emptyBody: `可选。需要可说设定对象/背景，或补充${segmentLabel}`,
    });
  }

  return mergeStepCopy(step);
}

/** 表达步骤应突出哪些子字段 */
export function getExpressionFieldsForModalities(
  modalities: MediaModalityId[],
): Array<"audience" | "verbal" | "visual"> {
  const set = new Set(modalities);
  const fields: Array<"audience" | "verbal" | "visual"> = ["audience"];
  if (set.has("text") || set.has("audio") || set.has("video")) {
    fields.push("verbal");
  }
  if (set.has("image") || set.has("video")) {
    fields.push("visual");
  }
  if (fields.length === 1) {
    fields.push("verbal", "visual");
  }
  return [...new Set(fields)];
}

export function getProfileModalities(raw: WorkProfile | undefined): MediaModalityId[] {
  return resolveModalities(parseProfileJson(raw));
}
