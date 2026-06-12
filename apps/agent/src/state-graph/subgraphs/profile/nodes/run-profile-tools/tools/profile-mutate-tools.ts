/** 作品方案原子修改工具 */
import { z } from "zod";

import { getProfile, getState } from "#agent/state-io/index.js";

import { createProfileTool } from "./helpers/run-profile-tool.js";
import {
  buildDeliveryPatch,
  buildExpressionPatch,
  buildParamsPatch,
  deliveryFieldsSchema,
  expressionFieldsSchema,
  guardrailInputSchema,
  paramsFieldsSchema,
  segmentInputSchema,
  settingInputSchema,
} from "./schemas.js";

export const updateProfileDelivery = createProfileTool({
  name: "update_profile_delivery",
  description: "更新交付规格（主题、体裁、媒介、平台、分类）。",
  schema: deliveryFieldsSchema,
  toPatch: (input) => ({ delivery: buildDeliveryPatch(input) }),
  emptyMessage: "未提供可更新的交付规格字段。",
});

export const updateProfileSummary = createProfileTool({
  name: "update_profile_summary",
  description: "更新一句话内容定位（blueprint.summary）。",
  schema: z.object({
    summary: z.string().min(1).describe("一句话内容定位"),
  }),
  toPatch: (input) => ({ summary: input.summary }),
});

export const updateProfileExpression = createProfileTool({
  name: "update_profile_expression",
  description: "更新表达设定（受众、语气文风、画风氛围）。",
  schema: expressionFieldsSchema,
  toPatch: (input) => ({ expression: buildExpressionPatch(input) }),
  emptyMessage: "未提供可更新的表达设定字段。",
});

export const updateProfileParams = createProfileTool({
  name: "update_profile_params",
  description: "更新体裁参数（字数、比例、时长等）。",
  schema: paramsFieldsSchema,
  toPatch: (input) => ({
    params: buildParamsPatch(getProfile(getState()), input),
  }),
  emptyMessage: "未提供可更新的体裁参数。",
});

export const clearProfileSettings = createProfileTool({
  name: "clear_profile_settings",
  description: "清空全部创作设定。",
  schema: z.object({}),
  toPatch: () => ({ clear_settings: true }),
});

export const replaceProfileSettings = createProfileTool({
  name: "replace_profile_settings",
  description: "整体替换创作设定列表（背景、对象等固定信息）。",
  schema: z.object({
    settings: z.array(settingInputSchema).min(1).max(12),
  }),
  toPatch: (input) => ({ settings_replace: input.settings }),
});

export const appendProfileSetting = createProfileTool({
  name: "append_profile_setting",
  description: "在创作设定末尾追加一条。",
  schema: settingInputSchema,
  toPatch: (input) => ({ settings_append: [input] }),
});

export const updateProfileSetting = createProfileTool({
  name: "update_profile_setting",
  description: "按 id 修改一条创作设定。",
  schema: z.object({
    setting_id: z.string().describe("创作设定 id，须从方案列表原样复制"),
    description: z.string().min(1),
    kind: z.enum(["character", "world", "other"]).nullable().optional(),
    title: z.string().nullable().optional(),
  }),
  toPatch: (input) => ({
    setting_updates: [
      {
        setting_id: input.setting_id,
        description: input.description,
        kind: input.kind,
        title: input.title,
      },
    ],
  }),
});

export const deleteProfileSetting = createProfileTool({
  name: "delete_profile_setting",
  description: "按 id 删除一条创作设定。",
  schema: z.object({
    setting_id: z.string().describe("创作设定 id，须从方案列表原样复制"),
  }),
  toPatch: (input) => ({ setting_deletes: [input.setting_id] }),
});

export const clearProfileSegments = createProfileTool({
  name: "clear_profile_segments",
  description: "清空全部结构段。",
  schema: z.object({}),
  toPatch: () => ({ clear_segments: true }),
});

export const replaceProfileSegments = createProfileTool({
  name: "replace_profile_segments",
  description: "按顺序整体替换结构段（内容走向）。",
  schema: z.object({
    segments: z.array(segmentInputSchema).min(1).max(8),
  }),
  toPatch: (input) => ({ segments_replace: input.segments }),
});

export const appendProfileSegment = createProfileTool({
  name: "append_profile_segment",
  description: "在结构段末尾追加一条。",
  schema: segmentInputSchema,
  toPatch: (input) => ({ segments_append: [input] }),
});

export const updateProfileSegment = createProfileTool({
  name: "update_profile_segment",
  description: "按 id 修改一条结构段。",
  schema: z.object({
    segment_id: z.string().describe("结构段 id，须从方案列表原样复制"),
    description: z.string().min(1),
    role: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
  }),
  toPatch: (input) => ({
    segment_updates: [
      {
        segment_id: input.segment_id,
        description: input.description,
        role: input.role,
        title: input.title,
      },
    ],
  }),
});

export const deleteProfileSegment = createProfileTool({
  name: "delete_profile_segment",
  description: "按 id 删除一条结构段。",
  schema: z.object({
    segment_id: z.string().describe("结构段 id，须从方案列表原样复制"),
  }),
  toPatch: (input) => ({ segment_deletes: [input.segment_id] }),
});

export const clearProfileGuardrails = createProfileTool({
  name: "clear_profile_guardrails",
  description: "清空全部创作规则。",
  schema: z.object({}),
  toPatch: () => ({ clear_guardrails: true }),
});

export const replaceProfileGuardrails = createProfileTool({
  name: "replace_profile_guardrails",
  description: "整体替换创作规则列表。",
  schema: z.object({
    guardrails: z.array(guardrailInputSchema).min(1),
  }),
  toPatch: (input) => ({ guardrails_replace: input.guardrails }),
});

export const appendProfileGuardrail = createProfileTool({
  name: "append_profile_guardrail",
  description: "在创作规则末尾追加一条。",
  schema: guardrailInputSchema,
  toPatch: (input) => ({ guardrails_append: [input] }),
});

export const updateProfileGuardrail = createProfileTool({
  name: "update_profile_guardrail",
  description: "按 id 修改一条创作规则。",
  schema: z.object({
    guardrail_id: z.string().describe("创作规则 id，须从方案列表原样复制"),
    description: z.string().min(1),
  }),
  toPatch: (input) => ({
    guardrail_updates: [
      {
        guardrail_id: input.guardrail_id,
        description: input.description,
      },
    ],
  }),
});

export const deleteProfileGuardrail = createProfileTool({
  name: "delete_profile_guardrail",
  description: "按 id 删除一条创作规则。",
  schema: z.object({
    guardrail_id: z.string().describe("创作规则 id，须从方案列表原样复制"),
  }),
  toPatch: (input) => ({ guardrail_deletes: [input.guardrail_id] }),
});
