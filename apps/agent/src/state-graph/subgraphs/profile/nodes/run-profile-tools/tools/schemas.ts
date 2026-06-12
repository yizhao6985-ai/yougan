import {
  CONTENT_FORMATS,
  DISCOVER_PLATFORMS,
  DISCOVER_TOPIC_CATEGORIES,
  MEDIA_MODALITIES,
  type FormatParams,
  type WorkProfile,
} from "@yougan/domain";
import { z } from "zod";

import type { ProfilePatch } from "../../mutate-profile/helpers/apply-profile-patch.js";

const CONTENT_FORMAT_IDS = CONTENT_FORMATS.map((item) => item.id) as [
  (typeof CONTENT_FORMATS)[number]["id"],
  ...(typeof CONTENT_FORMATS)[number]["id"][],
];
const MEDIA_MODALITY_IDS = MEDIA_MODALITIES.map((item) => item.id) as [
  (typeof MEDIA_MODALITIES)[number]["id"],
  ...(typeof MEDIA_MODALITIES)[number]["id"][],
];
const PLATFORM_IDS = DISCOVER_PLATFORMS.map((item) => item.id) as [
  (typeof DISCOVER_PLATFORMS)[number]["id"],
  ...(typeof DISCOVER_PLATFORMS)[number]["id"][],
];
const TOPIC_CATEGORY_IDS = DISCOVER_TOPIC_CATEGORIES.map((item) => item.id) as [
  (typeof DISCOVER_TOPIC_CATEGORIES)[number]["id"],
  ...(typeof DISCOVER_TOPIC_CATEGORIES)[number]["id"][],
];

export const deliveryTaxonomyPrompt = [
  "交付规格 taxonomy（update_profile_delivery 须用 id，勿用中文标签）：",
  `体裁 format：${CONTENT_FORMATS.map((item) => `${item.id}=${item.label}`).join("、")}`,
  `媒介 modalities：${MEDIA_MODALITIES.map((item) => `${item.id}=${item.label}`).join("、")}（可组合，如 ["text","image"]）`,
  `平台 platform：${DISCOVER_PLATFORMS.map((item) => item.id).join("、")}`,
  `分类 category：${DISCOVER_TOPIC_CATEGORIES.map((item) => `${item.id}=${item.label}`).join("、")}`,
].join("\n");

export const segmentInputSchema = z.object({
  description: z.string().min(1),
  role: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
});

export const guardrailInputSchema = z.object({
  description: z.string().min(1),
  scope: z
    .enum(["all", "verbal", "visual", "audio", "video"])
    .optional()
    .default("all"),
});

export const settingInputSchema = z.object({
  description: z.string().min(1),
  kind: z
    .enum(["character", "world", "other"])
    .optional()
    .describe("设定类型：character 对象/主体、world 背景/语境、other 其他"),
  title: z.string().nullable().optional().describe("设定名称"),
});

export const deliveryFieldsSchema = z.object({
  topic: z.string().optional().describe("创作主题（一句话题眼）"),
  format: z
    .enum(CONTENT_FORMAT_IDS)
    .optional()
    .describe("体裁 id，须从 taxonomy 选取"),
  modalities: z
    .array(z.enum(MEDIA_MODALITY_IDS))
    .optional()
    .describe("媒介组合 id 数组"),
  platform: z
    .enum(PLATFORM_IDS)
    .nullable()
    .optional()
    .describe("目标发布平台 id"),
  category: z
    .enum(TOPIC_CATEGORY_IDS)
    .nullable()
    .optional()
    .describe("内容分类 id"),
});

export const expressionFieldsSchema = z.object({
  audience: z.string().nullable().optional().describe("目标受众"),
  verbal_tone: z.string().nullable().optional().describe("语气"),
  verbal_style: z.string().nullable().optional().describe("文风"),
  verbal_persona: z.string().nullable().optional().describe("人设或口吻"),
  visual_style: z.string().nullable().optional().describe("画风或视觉风格"),
  visual_mood: z.string().nullable().optional().describe("画面氛围"),
  visual_palette: z.string().nullable().optional().describe("主色或配色"),
});

export const paramsFieldsSchema = z.object({
  kind: z.enum(["text", "illustration", "video", "audio"]).optional(),
  word_count_min: z.number().optional(),
  word_count_max: z.number().optional(),
  emoji_level: z.enum(["none", "light", "heavy"]).optional(),
  aspect_ratio: z.string().optional(),
  image_count: z.number().optional(),
  negative_hints: z.array(z.string()).optional(),
  duration_sec: z.number().optional(),
  pacing: z.string().optional(),
  segment_count: z.number().optional(),
});

export function buildExpressionPatch(
  input: z.infer<typeof expressionFieldsSchema>,
): ProfilePatch["expression"] | undefined {
  const hasVerbal =
    input.verbal_tone !== undefined ||
    input.verbal_style !== undefined ||
    input.verbal_persona !== undefined;
  const hasVisual =
    input.visual_style !== undefined ||
    input.visual_mood !== undefined ||
    input.visual_palette !== undefined;

  if (input.audience === undefined && !hasVerbal && !hasVisual) {
    return undefined;
  }

  return {
    audience: input.audience,
    verbal: hasVerbal
      ? {
          tone: input.verbal_tone,
          style: input.verbal_style,
          persona: input.verbal_persona,
        }
      : undefined,
    visual: hasVisual
      ? {
          style: input.visual_style,
          mood: input.visual_mood,
          palette: input.visual_palette,
        }
      : undefined,
  };
}

export function buildParamsPatch(
  profile: WorkProfile,
  input: z.infer<typeof paramsFieldsSchema>,
): FormatParams | undefined {
  const hasParams =
    input.kind !== undefined ||
    input.word_count_min !== undefined ||
    input.word_count_max !== undefined ||
    input.emoji_level !== undefined ||
    input.aspect_ratio !== undefined ||
    input.image_count !== undefined ||
    input.negative_hints !== undefined ||
    input.duration_sec !== undefined ||
    input.pacing !== undefined ||
    input.segment_count !== undefined;

  if (!hasParams) return undefined;

  const kind = input.kind ?? profile.params.kind;
  if (kind === "illustration") {
    return {
      kind: "illustration",
      aspect_ratio: input.aspect_ratio,
      image_count: input.image_count,
      negative_hints: input.negative_hints,
    };
  }
  if (kind === "video") {
    return {
      kind: "video",
      duration_sec: input.duration_sec,
      aspect_ratio: input.aspect_ratio,
      pacing: input.pacing,
    };
  }
  if (kind === "audio") {
    return {
      kind: "audio",
      duration_sec: input.duration_sec,
      segment_count: input.segment_count,
    };
  }
  return {
    kind: "text",
    word_count:
      input.word_count_min !== undefined || input.word_count_max !== undefined
        ? {
            min: input.word_count_min,
            max: input.word_count_max,
          }
        : undefined,
    emoji_level: input.emoji_level,
  };
}

export function buildDeliveryPatch(
  input: z.infer<typeof deliveryFieldsSchema>,
): ProfilePatch["delivery"] | undefined {
  const delivery = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  return Object.keys(delivery).length > 0 ? delivery : undefined;
}
