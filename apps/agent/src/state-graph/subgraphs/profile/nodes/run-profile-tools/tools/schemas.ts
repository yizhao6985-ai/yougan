import {
  CONTENT_FORMATS,
  SEQUENCE_ROLES,
} from "@yougan/domain";
import { z } from "zod";

import type { ProfilePatch } from "../../mutate-profile/helpers/apply-profile-patch.js";

const CONTENT_FORMAT_IDS = CONTENT_FORMATS.map((item) => item.id) as [
  (typeof CONTENT_FORMATS)[number]["id"],
  ...(typeof CONTENT_FORMATS)[number]["id"][],
];

export const formatTaxonomyPrompt = [
  "内容形式 format（update_profile_direction）：",
  `${CONTENT_FORMATS.map((item) => `${item.id}=${item.label}`).join("、")}（须用 id；创作模板，媒介由 format 与节拍推断）`,
].join("\n");

const listModeSchema = z
  .enum(["append", "replace", "clear"])
  .optional()
  .describe("默认 append；clear 清空该列表");

export const specInputSchema = z.object({
  spec: z.string().min(1).describe("一条正向或反向说明"),
});

export const sequenceInputSchema = z.object({
  spec: z.string().min(1).describe("本节内容意图（正向描述）"),
  role: z
    .enum(SEQUENCE_ROLES)
    .nullable()
    .optional()
    .describe("媒介节拍：text / image / audio / video"),
});

export const directionFieldsSchema = z.object({
  summary: z
    .string()
    .min(1)
    .optional()
    .describe("创作定位。须从用户消息凝练写入"),
  format: z.enum(CONTENT_FORMAT_IDS).optional().describe("内容形式 id"),
  audience: z.string().nullable().optional().describe("目标受众"),
});

export const styleFieldsSchema = z.object({
  verbal: z
    .string()
    .nullable()
    .optional()
    .describe("文字风格（语气、文风、口吻）"),
  visual: z
    .string()
    .nullable()
    .optional()
    .describe("画面方向（画风、氛围、配色）"),
});

export const contextFieldsSchema = z.object({
  items: z.array(specInputSchema).optional(),
  mode: listModeSchema,
});

export const sequenceFieldsSchema = z.object({
  items: z.array(sequenceInputSchema).optional(),
  mode: listModeSchema,
});

export const boundsFieldsSchema = z.object({
  items: z.array(specInputSchema).optional(),
  mode: listModeSchema,
});

export function buildDirectionPatch(
  input: z.infer<typeof directionFieldsSchema>,
): ProfilePatch["direction"] | undefined {
  const direction = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  return Object.keys(direction).length > 0 ? direction : undefined;
}

export function buildStylePatch(
  input: z.infer<typeof styleFieldsSchema>,
): ProfilePatch["style"] | undefined {
  if (input.verbal === undefined && input.visual === undefined) {
    return undefined;
  }
  return {
    verbal: input.verbal,
    visual: input.visual,
  };
}

function buildSpecListPatch(
  input: { items?: z.infer<typeof specInputSchema>[]; mode?: "append" | "replace" | "clear" },
  keys: {
    clear: keyof ProfilePatch;
    replace: keyof ProfilePatch;
    append: keyof ProfilePatch;
  },
): ProfilePatch {
  const patch: ProfilePatch = {};
  if (input.mode === "clear") {
    (patch as Record<string, boolean>)[keys.clear as string] = true;
    return patch;
  }
  if (!input.items?.length) return patch;
  if (input.mode === "replace") {
    (patch as Record<string, unknown>)[keys.replace as string] = input.items;
  } else {
    (patch as Record<string, unknown>)[keys.append as string] = input.items;
  }
  return patch;
}

export function buildContextPatch(
  input: z.infer<typeof contextFieldsSchema>,
): ProfilePatch {
  return buildSpecListPatch(input, {
    clear: "clear_context",
    replace: "context_replace",
    append: "context_append",
  });
}

export function buildSequencePatch(
  input: z.infer<typeof sequenceFieldsSchema>,
): ProfilePatch {
  const patch: ProfilePatch = {};
  if (input.mode === "clear") {
    patch.clear_sequence = true;
    return patch;
  }
  if (!input.items?.length) return patch;
  if (input.mode === "replace") {
    patch.sequence_replace = input.items;
  } else {
    patch.sequence_append = input.items;
  }
  return patch;
}

export function buildBoundsPatch(
  input: z.infer<typeof boundsFieldsSchema>,
): ProfilePatch {
  return buildSpecListPatch(input, {
    clear: "clear_bounds",
    replace: "bounds_replace",
    append: "bounds_append",
  });
}
