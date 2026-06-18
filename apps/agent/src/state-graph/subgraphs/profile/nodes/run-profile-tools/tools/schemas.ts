import {
  CONTENT_FORMATS,
  MEDIA_MODALITIES,
  SEGMENT_ROLES,
  normalizeConstraintScope,
  normalizeProfileAspectRatio,
  sortMediaModalities,
  type ContentFormatId,
  type DeliveryMediaParams,
  type MediaModalityId,
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

export const deliveryTaxonomyPrompt = [
  "内容形态与规格（update_profile_delivery）：",
  `形态 format：${CONTENT_FORMATS.map((item) => `${item.id}=${item.label}`).join("、")}（须用 id；创作模板/归类，**不限制**实际媒介组合）`,
  `内容媒介 modalities：${MEDIA_MODALITIES.map((item) => `${item.id}=${item.label}`).join("、")}（须用 id 数组；混排须全部列出，如 note 类作品常用 ["text","image"]）`,
  "规格 media_params（各媒介最小单元形式，不含张数/段落数等内容规划）：",
  "  - text：word_count_min/max、emoji_level",
  "  - image：aspect_ratio（例：3:4 竖图）",
  "  - video：duration_sec、aspect_ratio、pacing",
  "  - audio：duration_sec",
  "混排示例：modalities [\"text\",\"image\"] + word_count_max 800 + aspect_ratio \"3:4\"",
  "画幅 aspect_ratio：MiniMax id（1:1、3:4、4:3、2:3、3:2、16:9、9:16、21:9）",
  "创作阶段不写发布分类/平台；聚焦作品内容",
].join("\n");

export const segmentInputSchema = z.object({
  description: z.string().min(1),
  role: z
    .enum(SEGMENT_ROLES)
    .nullable()
    .optional()
    .describe("媒介节拍：text / image / audio / video"),
  title: z.string().nullable().optional(),
});

export const constraintInputSchema = z.object({
  description: z.string().min(1),
  scope: z
    .preprocess(
      (value) => normalizeConstraintScope(value, "all"),
      z.enum(["all", "verbal", "visual", "audio", "video"]),
    )
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
    .describe("主内容形态 id，须从 taxonomy 选取"),
  modalities: z
    .array(z.enum(MEDIA_MODALITY_IDS))
    .optional()
    .describe("作品实际包含的媒介 id 数组；混排须全部列出"),
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

export const mediaParamsFieldsSchema = z.object({
  word_count_min: z.number().optional().describe("文字最少字数"),
  word_count_max: z.number().optional().describe("文字最多字数"),
  emoji_level: z.enum(["none", "light", "heavy"]).optional(),
  aspect_ratio: z
    .string()
    .optional()
    .describe(
      "MiniMax 画幅 id：1:1、3:4、4:3、2:3、3:2、16:9、9:16、21:9",
    ),
  duration_sec: z.number().optional().describe("视频/音频时长（秒）"),
  pacing: z.string().optional().describe("视频节奏"),
});

/** 第 2 步：形态 + 媒介 + 分媒介规格 */
export const deliveryStepFieldsSchema =
  deliveryFieldsSchema.merge(mediaParamsFieldsSchema);

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

function ratioContextFromProfile(
  profile: WorkProfile,
  deliveryContext?: {
    format?: ContentFormatId | null;
    modalities?: MediaModalityId[];
  },
) {
  return {
    format: deliveryContext?.format ?? profile.delivery.format,
    modalities:
      deliveryContext?.modalities ?? profile.delivery.modalities,
  };
}

function shouldPatchVideo(
  profile: WorkProfile,
  deliveryContext: { format?: ContentFormatId | null; modalities?: MediaModalityId[] },
  input: z.infer<typeof mediaParamsFieldsSchema>,
): boolean {
  const modalities = new Set(
    deliveryContext.modalities ?? profile.delivery.modalities,
  );
  const format = deliveryContext.format ?? profile.delivery.format;
  if (input.pacing !== undefined) return true;
  if (input.aspect_ratio !== undefined && modalities.has("video")) return true;
  if (input.duration_sec !== undefined) {
    if (modalities.has("video")) return true;
    if (!modalities.has("audio") && (format === "short_video" || format === "video_script")) {
      return true;
    }
  }
  return Boolean(profile.delivery.media_params.video);
}

function shouldPatchAudio(
  profile: WorkProfile,
  deliveryContext: { format?: ContentFormatId | null; modalities?: MediaModalityId[] },
  input: z.infer<typeof mediaParamsFieldsSchema>,
): boolean {
  const modalities = new Set(
    deliveryContext.modalities ?? profile.delivery.modalities,
  );
  const format = deliveryContext.format ?? profile.delivery.format;
  if (input.duration_sec !== undefined) {
    if (modalities.has("audio") && !modalities.has("video")) return true;
    if (format === "podcast" || format === "music") return true;
  }
  return Boolean(profile.delivery.media_params.audio);
}

export function buildMediaParamsPatch(
  profile: WorkProfile,
  input: z.infer<typeof mediaParamsFieldsSchema>,
  deliveryContext?: {
    format?: ContentFormatId | null;
    modalities?: MediaModalityId[];
  },
): DeliveryMediaParams | undefined {
  const hasText =
    input.word_count_min !== undefined ||
    input.word_count_max !== undefined ||
    input.emoji_level !== undefined;
  const hasImage = input.aspect_ratio !== undefined;
  const patchVideo = shouldPatchVideo(profile, deliveryContext ?? {}, input);
  const patchAudio = shouldPatchAudio(profile, deliveryContext ?? {}, input);

  if (!hasText && !hasImage && !patchVideo && !patchAudio) return undefined;

  const ctx = ratioContextFromProfile(profile, deliveryContext);
  const existing = profile.delivery.media_params;
  const patch: DeliveryMediaParams = {};

  if (hasText) {
    patch.text = {
      word_count:
        input.word_count_min !== undefined || input.word_count_max !== undefined
          ? {
              min: input.word_count_min,
              max: input.word_count_max,
            }
          : existing.text?.word_count,
      emoji_level: input.emoji_level ?? existing.text?.emoji_level,
    };
  }

  const modalities = new Set(
    deliveryContext?.modalities ?? profile.delivery.modalities,
  );

  if (hasImage) {
    const rawRatio = input.aspect_ratio ?? existing.image?.aspect_ratio;
    patch.image = {
      aspect_ratio: rawRatio
        ? normalizeProfileAspectRatio(rawRatio, ctx)
        : undefined,
    };
  }

  if (patchVideo || existing.video) {
    const rawRatio =
      input.aspect_ratio && modalities.has("video")
        ? input.aspect_ratio
        : existing.video?.aspect_ratio;
    patch.video = {
      duration_sec: input.duration_sec ?? existing.video?.duration_sec,
      aspect_ratio: rawRatio
        ? normalizeProfileAspectRatio(rawRatio, ctx)
        : undefined,
      pacing: input.pacing ?? existing.video?.pacing,
    };
  }

  if (patchAudio || existing.audio) {
    patch.audio = {
      duration_sec:
        patchAudio && input.duration_sec !== undefined
          ? input.duration_sec
          : existing.audio?.duration_sec,
    };
  }

  return Object.keys(patch).length > 0 ? patch : undefined;
}

export function buildDeliveryPatch(
  input: z.infer<typeof deliveryFieldsSchema>,
): ProfilePatch["delivery"] | undefined {
  const delivery = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  return Object.keys(delivery).length > 0 ? delivery : undefined;
}

function modalitiesWithMediaParams(
  base: MediaModalityId[],
  media_params: DeliveryMediaParams | undefined,
): MediaModalityId[] {
  const set = new Set(base);
  if (media_params?.text) set.add("text");
  if (media_params?.image) set.add("image");
  if (media_params?.video) set.add("video");
  if (media_params?.audio) set.add("audio");
  return sortMediaModalities([...set]);
}

export function buildDeliveryStepPatch(
  profile: WorkProfile,
  input: z.infer<typeof deliveryStepFieldsSchema>,
): ProfilePatch["delivery"] | undefined {
  const delivery = buildDeliveryPatch(input);
  const nextModalities =
    input.modalities ??
    delivery?.modalities ??
    profile.delivery.modalities;
  const media_params = buildMediaParamsPatch(profile, input, {
    format: (input.format ?? profile.delivery.format) as ContentFormatId | null,
    modalities: nextModalities,
  });
  if (!delivery && !media_params) return undefined;

  const modalities = modalitiesWithMediaParams(nextModalities, media_params);
  return {
    ...delivery,
    modalities,
    ...(media_params ? { media_params } : {}),
  };
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
