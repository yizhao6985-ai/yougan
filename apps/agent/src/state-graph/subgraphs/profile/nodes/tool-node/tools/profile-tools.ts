/** 作品方案批量 patch 工具 */
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { z } from "zod";

import {
  applyProfilePatch,
  type FormatParams,
  type ProfilePatch,
  type WorkProfile,
} from "@yougan/domain";
import {
  getProfile,
  getState,
  patchPendingProfile,
} from "#agent/state-io/index.js";

const segmentInputSchema = z.object({
  description: z.string().min(1),
  role: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
});

const guardrailInputSchema = z.object({
  description: z.string().min(1),
  scope: z
    .enum(["all", "verbal", "visual", "audio", "video"])
    .optional()
    .default("all"),
});

export const profileApplyPatchSchema = z.object({
  delivery: z
    .object({
      topic: z.string().optional(),
      format: z.string().optional(),
      modalities: z.array(z.string()).optional(),
      platform: z.string().nullable().optional(),
      category: z.string().nullable().optional(),
      intent: z.string().nullable().optional(),
    })
    .optional()
    .describe("交付规格：主题、体裁、媒介、平台、分类、用户原话"),
  expression: z
    .object({
      audience: z.string().nullable().optional(),
      verbal_tone: z.string().nullable().optional(),
      verbal_style: z.string().nullable().optional(),
      verbal_persona: z.string().nullable().optional(),
      visual_style: z.string().nullable().optional(),
      visual_mood: z.string().nullable().optional(),
      visual_palette: z.string().nullable().optional(),
    })
    .optional()
    .describe("表达设定：受众、语气文风、画风氛围"),
  summary: z.string().optional().describe("一句话内容定位"),
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
  clear_segments: z
    .boolean()
    .optional()
    .describe("清空全部结构段；换方向时与 segments_replace 组合"),
  segments_replace: z
    .array(segmentInputSchema)
    .max(8)
    .optional()
    .describe("按顺序整体替换结构段（3–8 条为宜）"),
  segments_append: z
    .array(segmentInputSchema)
    .max(8)
    .optional()
    .describe("在现有结构段末尾追加"),
  segment_updates: z
    .array(
      z.object({
        segment_id: z.string(),
        description: z.string().min(1),
        role: z.string().nullable().optional(),
        title: z.string().nullable().optional(),
      }),
    )
    .optional()
    .describe("按 id 修改已有结构段"),
  segment_deletes: z.array(z.string()).optional().describe("按 id 删除结构段"),
  clear_guardrails: z.boolean().optional().describe("清空全部创作规则"),
  guardrails_replace: z
    .array(guardrailInputSchema)
    .optional()
    .describe("整体替换创作规则列表"),
  guardrails_append: z
    .array(guardrailInputSchema)
    .optional()
    .describe("在现有规则末尾追加"),
  guardrail_updates: z
    .array(
      z.object({
        guardrail_id: z.string(),
        description: z.string().min(1),
      }),
    )
    .optional()
    .describe("按 id 修改已有创作规则"),
  guardrail_deletes: z
    .array(z.string())
    .optional()
    .describe("按 id 删除创作规则"),
});

export type ProfileApplyPatchInput = z.infer<typeof profileApplyPatchSchema>;

function buildExpressionPatch(
  input: NonNullable<ProfileApplyPatchInput["expression"]>,
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

function buildParamsPatch(
  profile: WorkProfile,
  input: ProfileApplyPatchInput,
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

function toProfilePatch(
  profile: WorkProfile,
  input: ProfileApplyPatchInput,
): ProfilePatch {
  const delivery = input.delivery
    ? Object.fromEntries(
        Object.entries(input.delivery).filter(
          ([, value]) => value !== undefined,
        ),
      )
    : undefined;

  return {
    delivery:
      delivery && Object.keys(delivery).length > 0 ? delivery : undefined,
    expression: input.expression
      ? buildExpressionPatch(input.expression)
      : undefined,
    summary: input.summary,
    params: buildParamsPatch(profile, input),
    clear_segments: input.clear_segments,
    segments_replace: input.segments_replace,
    segments_append: input.segments_append,
    segment_updates: input.segment_updates,
    segment_deletes: input.segment_deletes,
    clear_guardrails: input.clear_guardrails,
    guardrails_replace: input.guardrails_replace,
    guardrails_append: input.guardrails_append,
    guardrail_updates: input.guardrail_updates,
    guardrail_deletes: input.guardrail_deletes,
  };
}

export const profileApplyPatch = tool(
  async (input, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const state = getState();

    const profile = getProfile(state);
    const result = applyProfilePatch(profile, toProfilePatch(profile, input));
    if (!result) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "未提供可应用的方案变更。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    const messageParts = [`已更新：${result.changes.join("、")}。`];
    if (result.profile.blueprint.segments.length) {
      messageParts.push(
        `结构段共 ${result.profile.blueprint.segments.length} 节。`,
      );
    }
    if (result.profile.guardrails.length) {
      messageParts.push(`创作规则共 ${result.profile.guardrails.length} 条。`);
    }
    const message =
      result.warnings.length > 0
        ? `${messageParts.join(" ")} 注意：${result.warnings.join("；")}`
        : messageParts.join(" ");

    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: message,
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProfile(state, result.profile),
      },
    });
  },
  {
    name: "profile_apply_patch",
    description:
      "读写作品方案（唯一入口）。字段：delivery、expression、summary、体裁参数、结构段与创作规则。参考素材由 reference 子图维护，勿在此写入。",
    schema: profileApplyPatchSchema,
  },
);
