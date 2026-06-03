/**
 * 灵感/创作模式确认内容规格（体裁 + 媒介形式）。
 * 灵感模式禁止 update_work_profile，但允许通过本工具写入结构化分类。
 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import {
  CONTENT_FORMATS,
  MEDIA_MODALITIES,
  contentFormatLabel,
  isValidContentFormat,
  isValidMediaModality,
  mediaModalityLabel,
  resolveContentSpec,
} from "../lib/content-spec.js";
import { normalizePlatform } from "../schema.js";
import { parseActiveTurnKind, parseProfile } from "../lib/parse-agent-state.js";
import { getState, updateProfile } from "../lib/tool-state.js";
import { toolCommand } from "../lib/tool-command.js";

const formatIds = CONTENT_FORMATS.map((item) => item.id) as [
  string,
  ...string[],
];
const modalityIds = MEDIA_MODALITIES.map((item) => item.id) as [
  string,
  ...string[],
];

export const confirmContentSpec = tool(
  async (input, config) => {
    const task = parseActiveTurnKind(getState());
    if (task !== "inspiration" && task !== "ask") {
      return toolCommand(
        config,
        "confirm_content_spec 仅在灵感或提问任务中可用。",
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

    if (!Object.keys(updates).length) {
      return toolCommand(config, "未提供需要确认的内容规格字段。");
    }

    const profile = resolveContentSpec(updateProfile(getState(), updates));
    const summary = [
      contentFormatLabel(profile.content_format),
      mediaModalityLabel(profile.media_modality),
    ]
      .filter(Boolean)
      .join(" · ");

    return toolCommand(
      config,
      `已确认内容规格${summary ? `：${summary}` : ""}`,
      { profile },
    );
  },
  {
    name: "confirm_content_spec",
    description:
      "用户已明确体裁或媒介形式（如「写小红书笔记」「做播客」「拍短视频」）时调用，写入结构化 content_format / media_modality。灵感模式优先用此工具而非 update_work_profile。",
    schema: z.object({
      platform: z.string().nullable().optional(),
      content_topic: z.string().nullable().optional(),
      content_type: z.string().nullable().optional(),
      content_format: z.enum(formatIds).nullable().optional(),
      media_modality: z.enum(modalityIds).nullable().optional(),
    }),
  },
);
