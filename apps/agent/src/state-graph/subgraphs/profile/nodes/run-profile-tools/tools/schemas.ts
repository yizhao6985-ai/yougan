import {
  CONTENT_FORMATS,
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
const TOPIC_CATEGORY_IDS = DISCOVER_TOPIC_CATEGORIES.map((item) => item.id) as [
  (typeof DISCOVER_TOPIC_CATEGORIES)[number]["id"],
  ...(typeof DISCOVER_TOPIC_CATEGORIES)[number]["id"][],
];

export const deliveryTaxonomyPrompt = [
  "体裁与参数（update_profile_delivery）：",
  `体裁 format：${CONTENT_FORMATS.map((item) => `${item.id}=${item.label}`).join("、")}（须用 id）`,
  "平台 platform：按用户表述写入发布平台名称（自由文本，如「小红书」「微信公众号」），勿套用系统 id",
  "媒介 modalities：通常由体裁自动推断；仅明确混合媒介时显式指定",
  "参数 params：word_count_min/max（字数）、duration_sec（时长）、aspect_ratio（画幅）等，与 format 同次写入",
].join("\n");

export const segmentInputSchema = z.object({
  description: z.string().min(1),
  role: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
});

export const constraintInputSchema = z.object({
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

export const intentFieldsSchema = z.object({
  summary: z
    .string()
    .min(1)
    .describe(
      "创作定位（面向制作的一句话，第 1 步必填）。须从用户消息凝练写入",
    ),
});

export const deliveryFieldsSchema = z.object({
  format: z
    .enum(CONTENT_FORMAT_IDS)
    .optional()
    .describe("体裁 id，须从 taxonomy 选取"),
  modalities: z
    .array(z.enum(MEDIA_MODALITY_IDS))
    .optional()
    .describe("媒介组合 id 数组"),
  platform: z
    .string()
    .nullable()
    .optional()
    .describe("目标发布平台（用户表述的平台名称，自由文本）"),
  category: z
    .enum(TOPIC_CATEGORY_IDS)
    .nullable()
    .optional()
    .describe("内容分类 id"),
});

export const expressionFieldsSchema = z.object({
  audience: z.string().nullable().optional().describe("目标受众"),
  verbal: z
    .string()
    .nullable()
    .optional()
    .describe("文字风格（语气、文风、人设/口吻，一段话）"),
  visual: z
    .string()
    .nullable()
    .optional()
    .describe("画面方向（画风、氛围、配色，一段话）"),
});

export const paramsFieldsSchema = z.object({
  kind: z.enum(["text", "illustration", "video", "audio"]).optional(),
  word_count_min: z.number().optional().describe("最少字数"),
  word_count_max: z.number().optional().describe("最多字数"),
  emoji_level: z.enum(["none", "light", "heavy"]).optional(),
  aspect_ratio: z.string().optional().describe("画幅比例"),
  image_count: z.number().optional(),
  negative_hints: z.array(z.string()).optional(),
  duration_sec: z.number().optional().describe("时长（秒）"),
  pacing: z.string().optional(),
  segment_count: z.number().optional(),
});

/** 第 2 步：体裁 + 参数（一步一工具） */
export const deliveryStepFieldsSchema =
  deliveryFieldsSchema.merge(paramsFieldsSchema);

const structureModeSchema = z
  .enum(["append", "replace", "clear"])
  .optional()
  .describe("默认 append；clear 清空该列表");

/** 第 4 步：固定设定 + 结构段 */
export const structureFieldsSchema = z.object({
  settings: z.array(settingInputSchema).optional(),
  settings_mode: structureModeSchema,
  segments: z.array(segmentInputSchema).optional(),
  segments_mode: structureModeSchema,
});

/** 第 5 步：创作规则 */
export const constraintsFieldsSchema = z.object({
  rules: z.array(constraintInputSchema).optional(),
  mode: structureModeSchema,
});

export function buildIntentPatch(
  input: z.infer<typeof intentFieldsSchema>,
): ProfilePatch["intent"] | undefined {
  const intent = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  return Object.keys(intent).length > 0 ? intent : undefined;
}

export function buildExpressionPatch(
  input: z.infer<typeof expressionFieldsSchema>,
): ProfilePatch["expression"] | undefined {
  if (
    input.audience === undefined &&
    input.verbal === undefined &&
    input.visual === undefined
  ) {
    return undefined;
  }

  return {
    audience: input.audience,
    verbal: input.verbal,
    visual: input.visual,
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

  const kind = input.kind ?? profile.delivery.params.kind;
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

export function buildDeliveryStepPatch(
  profile: WorkProfile,
  input: z.infer<typeof deliveryStepFieldsSchema>,
): ProfilePatch["delivery"] | undefined {
  const delivery = buildDeliveryPatch(input);
  const params = buildParamsPatch(profile, input);
  if (!delivery && !params) return undefined;
  return { ...delivery, ...(params ? { params } : {}) };
}

export function buildStructurePatch(
  input: z.infer<typeof structureFieldsSchema>,
): ProfilePatch {
  const patch: ProfilePatch = {};

  if (input.settings_mode === "clear") {
    patch.clear_settings = true;
  } else if (input.settings?.length) {
    if (input.settings_mode === "replace") {
      patch.settings_replace = input.settings;
    } else {
      patch.settings_append = input.settings;
    }
  }

  if (input.segments_mode === "clear") {
    patch.clear_segments = true;
  } else if (input.segments?.length) {
    if (input.segments_mode === "replace") {
      patch.segments_replace = input.segments;
    } else {
      patch.segments_append = input.segments;
    }
  }

  return patch;
}

export function buildConstraintsPatch(
  input: z.infer<typeof constraintsFieldsSchema>,
): ProfilePatch {
  if (input.mode === "clear") return { clear_rules: true };
  if (!input.rules?.length) return {};
  if (input.mode === "replace") return { rules_replace: input.rules };
  return { rules_append: input.rules };
}
