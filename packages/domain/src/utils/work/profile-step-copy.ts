import type { ContentFormatId } from "../../models/content-form/formats.js";
import type { MediaModalityId } from "../../models/content-form/modalities.js";
import type { ProfileSetupStep, WorkProfile } from "../../models/work/profile.js";
import { inferModalitiesFromProfile, parseProfileJson } from "./profile.js";

export type ProfileStepCopy = {
  title: string;
  hint: string;
  emptyTitle: string;
  emptyBody: string;
  placeholder: string;
  suggestionExamples: string[];
};

type StepCopyVariant = Omit<ProfileStepCopy, "suggestionExamples"> & {
  suggestionExamples?: string[];
};

const DEFAULT_EXAMPLES: Record<
  Exclude<ProfileSetupStep, "ready">,
  string[]
> = {
  direction: [
    "三款平价防晒霜测评，图文笔记，给职场新人",
    "赛博朋克城市插画系列",
    "60 秒咖啡店探店短视频",
    "都市职场短篇小说",
  ],
  style: [
    "语气轻松口语",
    "画面简约蓝白、产品摄影感",
    "口播亲切、像朋友聊天",
    "高饱和霓虹，电影感构图",
  ],
  setting: [
    "林晓，内向产品经理",
    "虚构品牌，不对应真实商品",
    "品牌主色蓝白，科技感",
    "故事发生在 2030 年上海",
  ],
  requirements: [
    "全文约 800 字",
    "开头讲防晒焦虑痛点",
    "三款产品对比",
    "结尾给出选购建议",
  ],
  bounds: [
    "配图中不出现人脸",
    "不出现真实品牌 logo",
    "不要用震惊体标题",
  ],
};

const STYLE_VISUAL_EXAMPLES = [
  "扁平矢量插画风，粉蓝马卡龙配色",
  "复古手绘线条，手帐贴纸感",
  "电影感构图，高饱和霓虹夜景",
  "简约留白，日系水彩晕染",
] as const;

const STYLE_MIXED_EXAMPLES = [
  "语气轻松口语，配简约产品摄影感",
  "治愈软萌文案，画面干净留白",
  "专业克制短文，配高对比封面图",
  "种草笔记口吻，九宫格拼图风",
] as const;

const FORMAT_DIRECTION: Partial<Record<ContentFormatId, StepCopyVariant>> = {
  illustration: {
    title: "画面方向",
    hint: "这套作品要表达什么、什么体裁",
    emptyTitle: "还没定画面主题",
    emptyBody: "例如：「一组赛博朋克城市插画，霓虹夜景」",
    placeholder: "说说画面主题与形式…",
  },
  short_video: {
    title: "视频方向",
    hint: "视频讲什么、给谁看",
    emptyTitle: "还没定视频方向",
    emptyBody: "例如：「60 秒探店 vlog，给年轻上班族」",
    placeholder: "说说视频选题、形式与受众…",
  },
  novel: {
    title: "故事方向",
    hint: "故事讲什么、什么体裁、给谁看",
    emptyTitle: "还没定故事方向",
    emptyBody: "例如：「都市职场短篇，给轻小说读者」",
    placeholder: "说说故事定位、形式与受众…",
  },
};

const FORMAT_SETTING: Partial<Record<ContentFormatId, StepCopyVariant>> = {
  novel: {
    title: "故事背景",
    hint: "人物、时代、地点、世界观等创作依据",
    emptyTitle: "暂无故事背景",
    emptyBody: "例如：「主角林晓，28 岁内向产品经理」",
    placeholder: "说说人物与故事背景…",
  },
  illustration: {
    title: "创作背景",
    hint: "系列主题、世界观或固定视觉元素",
    emptyTitle: "暂无创作背景",
    emptyBody: "例如：「同一赛博朋克世界观下的城市角落」",
    placeholder: "说说系列背景…",
  },
};

const DEFAULT_STEP_COPY: Record<
  Exclude<ProfileSetupStep, "ready">,
  StepCopyVariant
> = {
  direction: {
    title: "方向",
    hint: "定位、内容形式与受众：为谁、以什么形式、讲什么事",
    emptyTitle: "还没定方向",
    emptyBody:
      "例如：「三款防晒霜测评，图文笔记，给职场新人」",
    placeholder: "说说定位、体裁与受众…",
  },
  style: {
    title: "风格",
    hint: "全稿默认文字语气与画面方向",
    emptyTitle: "还没定风格",
    emptyBody: "例如：「语气轻松」「画面简约蓝白」",
    placeholder: "说说文字与画面风格…",
  },
  setting: {
    title: "背景",
    hint: "品牌事实、故事背景、人设等 AI 需要知道的固定信息",
    emptyTitle: "暂无背景信息",
    emptyBody: "例如：「虚构品牌名」「主角是产品经理」",
    placeholder: "说说品牌、人物或故事背景…",
  },
  requirements: {
    title: "需求",
    hint: "对成稿的期望：字数、结构顺序、必含模块等",
    emptyTitle: "暂无需求说明",
    emptyBody: "例如：「800 字」「先讲痛点 → 三款对比 → 总结推荐」",
    placeholder: "说说字数、结构或对成稿的要求…",
  },
  bounds: {
    title: "边界",
    hint: "不要出现的内容、需避免的写法",
    emptyTitle: "暂无边界说明",
    emptyBody: "例如：「配图中不要人脸」「不要真实品牌名」",
    placeholder: "说说需要避开的内容…",
  },
};

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
      hint: "必填项已齐，可说「开始制作」；也可继续补充风格、背景、需求与边界",
      emptyTitle: "",
      emptyBody: "",
      placeholder: "说「开始制作」，或继续补充方案…",
      suggestionExamples: ["开始制作", "先补充背景和需求再制作"],
    };
  }

  const profile = parseProfileJson(raw);
  const format = profile.direction.format;

  if (step === "direction" && format && FORMAT_DIRECTION[format]) {
    return mergeStepCopy("direction", FORMAT_DIRECTION[format]);
  }

  if (step === "setting" && format && FORMAT_SETTING[format]) {
    return mergeStepCopy("setting", FORMAT_SETTING[format]);
  }

  if (step === "style") {
    const fields = getStyleFieldsForProfile(profile);
    const variant: Partial<StepCopyVariant> = {
      suggestionExamples: getStyleSuggestionExamples(profile),
    };
    if (fields.length === 1 && fields[0] === "visual") {
      variant.hint = "画面风格：构图、笔触、配色与光影";
      variant.emptyBody = "例如：「扁平矢量插画风，粉蓝马卡龙配色」";
      variant.placeholder = "说说画面风格…";
    } else if (fields.length === 1 && fields[0] === "verbal") {
      variant.hint = "文字语气与文风";
      variant.emptyBody = "例如：「语气轻松口语，像朋友聊天」";
      variant.placeholder = "说说文字语气与文风…";
    }
    return mergeStepCopy("style", variant);
  }

  return mergeStepCopy(step);
}

function getStyleSuggestionExamples(profile: WorkProfile): string[] {
  const fields = getStyleFieldsForProfile(profile);
  if (fields.length === 1 && fields[0] === "visual") {
    return [...STYLE_VISUAL_EXAMPLES];
  }
  const modalities = inferModalitiesFromProfile(profile);
  if (modalities.includes("image") && modalities.includes("text")) {
    return [...STYLE_MIXED_EXAMPLES];
  }
  return DEFAULT_EXAMPLES.style;
}

/** 风格步骤应突出哪些子字段 */
export function getStyleFieldsForProfile(
  profile: WorkProfile,
): Array<"verbal" | "visual"> {
  const format = profile.direction.format;
  const modalities = inferModalitiesFromProfile(profile);
  const hasImage = modalities.includes("image");
  const hasText = modalities.includes("text");

  if (format === "illustration" || (hasImage && !hasText)) return ["visual"];
  if (hasText && !hasImage) return ["verbal"];
  if (format === "music" || format === "podcast") return ["verbal", "visual"];
  return ["verbal", "visual"];
}

/** 从 profile 推断媒介组合 */
export function getProfileModalities(
  raw: WorkProfile | undefined,
): MediaModalityId[] {
  return inferModalitiesFromProfile(parseProfileJson(raw));
}
