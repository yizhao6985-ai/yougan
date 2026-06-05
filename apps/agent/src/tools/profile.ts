/**
 * 更新作品 profile（参考素材等；创作规格请用 blueprint 工具）。
 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { normalizePlatform } from "#agent/schema.js";
import {
  isValidContentFormat,
  isValidMediaModality,
  resolveContentSpec,
} from "#agent/lib/content-spec.js";
import { parseActiveTurnKind } from "#agent/lib/parse-agent-state.js";
import { getState, updateProfile } from "#agent/lib/tool-state.js";
import { toolCommand } from "#agent/lib/tool-command.js";

const profileSchema = z.object({
  platform: z.string().nullable().optional(),
  content_topic: z.string().nullable().optional(),
  content_type: z.string().nullable().optional(),
  content_format: z.string().nullable().optional(),
  media_modality: z.string().nullable().optional(),
  content_points: z.array(z.string()).nullable().optional(),
  style: z.string().nullable().optional(),
  tone: z.string().nullable().optional(),
  persona: z.string().nullable().optional(),
  audience: z.string().nullable().optional(),
  goals: z.array(z.string()).nullable().optional(),
  style_constraints: z.array(z.string()).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateWorkProfile = tool(
  async (input, config) => {
    if (parseActiveTurnKind(getState()) === "blueprint") {
      return toolCommand(
        config,
        "作品方案模式请用 update_blueprint_spec / update_blueprint_voice 更新规格与表达设定；本工具仅用于参考素材等 profile 字段。",
      );
    }

    const updates: Record<string, unknown> = {};
    if (input.platform != null) updates.platform = normalizePlatform(input.platform);
    if (input.content_topic != null) updates.content_topic = input.content_topic;
    if (input.content_type != null) updates.content_type = input.content_type;
    if (input.content_format != null) {
      if (!isValidContentFormat(input.content_format)) {
        return toolCommand(config, "无效的 content_format。");
      }
      updates.content_format = input.content_format;
    }
    if (input.media_modality != null) {
      if (!isValidMediaModality(input.media_modality)) {
        return toolCommand(config, "无效的 media_modality。");
      }
      updates.media_modality = input.media_modality;
    }
    if (input.content_points != null) updates.content_points = input.content_points;
    if (input.style != null) updates.style = input.style;
    if (input.tone != null) updates.tone = input.tone;
    if (input.persona != null) updates.persona = input.persona;
    if (input.style_constraints != null)
      updates.style_constraints = input.style_constraints;
    if (input.audience != null) updates.audience = input.audience;
    if (input.goals != null) updates.goals = input.goals;
    if (input.notes != null) updates.notes = input.notes;

    if (!Object.keys(updates).length) {
      return toolCommand(config, "未提供需要更新的字段。");
    }

    const profile = resolveContentSpec(updateProfile(getState(), updates));
    return toolCommand(
      config,
      `已更新作品特征：${Object.keys(updates).join("、")}`,
      { profile },
    );
  },
  {
    name: "update_work_profile",
    description: "更新作品创作特征。传入需要新增或修改的字段即可，未传字段保持不变。",
    schema: profileSchema,
  },
);
