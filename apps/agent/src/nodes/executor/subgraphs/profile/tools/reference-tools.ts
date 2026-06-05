/** 参考素材：parse_reference_text / parse_reference_image / delete_profile_reference */
import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { createChatModel } from "#agent/llm/dashscope.js";
import type { ReferenceItem } from "#agent/schema.js";
import {
  parseActiveTurnKind,
  parseProfile,
  parseReferences,
} from "#agent/lib/parse-agent-state.js";
import { truncateMessageContent } from "#agent/lib/message-content.js";
import { getLatestHumanMessageImageUrls } from "#agent/lib/human-message/index.js";
import {
  listKnownReferenceImageUrls,
  resolveReferenceImageUrl,
  upsertImageReference,
} from "#agent/lib/reference-images.js";
import { patchStagingProfile } from "#agent/lib/staging-state.js";
import { deleteProfileReference } from "@yougan/domain";
import { appendReferences, getState } from "#agent/lib/tool-state.js";
import { toolCommand } from "#agent/lib/tool-command.js";

export const parseReferenceText = tool(
  async ({ reference_text }, config) => {
    const llm = createChatModel({ temperature: 0.2 });
    const response = await llm.invoke([
      new HumanMessage(
        `提取参考文案的结构、语气、关键词，输出简洁中文摘要。\n\n${reference_text}`,
      ),
    ]);
    const summary = truncateMessageContent(response.content);
    const item: ReferenceItem = {
      source_type: "text",
      summary,
      keywords: [],
      raw_excerpt: reference_text.slice(0, 1000),
    };
    const state = getState();
    const profile = appendReferences(state, [item]);
    return toolCommand(
      config,
      "已解析参考文案并写入作品方案参考素材。",
      patchStagingProfile(state, profile),
    );
  },
  {
    name: "parse_reference_text",
    description: "用户提供参考文案时，结构化提取要点写入 references。",
    schema: z.object({ reference_text: z.string() }),
  },
);

export const parseReferenceImage = tool(
  async ({ image_url, hint }, config) => {
    const state = getState();
    const references = parseReferences(state);
    const messageUrls = getLatestHumanMessageImageUrls(state.messages);
    const knownUrls = listKnownReferenceImageUrls(references);
    const resolvedUrl = resolveReferenceImageUrl(
      image_url,
      messageUrls,
      knownUrls,
    );

    if (!resolvedUrl) {
      return toolCommand(config, "未找到可解析的参考图片 URL。");
    }

    const existing = references.find(
      (item) => item.source_type === "image" && item.image_url === resolvedUrl,
    );
    if (existing?.summary?.trim() && !hint?.trim()) {
      return toolCommand(config, "该参考图片已解析并写入 references。");
    }

    const llm = createChatModel({ temperature: 0.2 });
    const response = await llm.invoke([
      new HumanMessage({
        content: [
          {
            type: "text",
            text: `描述这张参考图的风格、构图、色调，用于后续创作参考。${hint ?? ""}`,
          },
          { type: "image_url", image_url: { url: resolvedUrl } },
        ],
      }),
    ]);
    const summary = truncateMessageContent(response.content);
    const item: ReferenceItem = {
      source_type: "image",
      summary,
      image_url: resolvedUrl,
    };
    const nextReferences = upsertImageReference(references, item);
    const profile = parseProfile(state);
    return toolCommand(
      config,
      "已解析参考图片并写入作品方案参考素材。",
      patchStagingProfile(state, { ...profile, references: nextReferences }),
    );
  },
  {
    name: "parse_reference_image",
    description:
      "用户提供参考图片 URL 时，解析视觉风格。image_url 须为用户本条消息附带的地址。",
    schema: z.object({
      image_url: z.string(),
      hint: z.string().optional().default(""),
    }),
  },
);

function requireProfileMode(config: object): string | null {
  if (parseActiveTurnKind(getState()) !== "profile") {
    return "作品方案工具仅在 profile 模式可用。";
  }
  return null;
}

export const deleteProfileReferenceTool = tool(
  async ({ image_url, index }, config) => {
    const gate = requireProfileMode(config);
    if (gate) return toolCommand(config, gate);
    if (image_url == null && index == null) {
      return toolCommand(config, "请提供 image_url 或 index。");
    }

    const state = getState();
    const profile = parseProfile(state);
    const refs = profile.references ?? [];
    if (!refs.length) {
      return toolCommand(config, "当前方案尚无参考素材。");
    }

    const next = deleteProfileReference(profile, { image_url, index });
    if (!next) {
      return toolCommand(config, "未找到要删除的参考素材。");
    }
    return toolCommand(
      config,
      `已删除参考素材（剩余 ${next.references?.length ?? 0} 条）。`,
      patchStagingProfile(state, next),
    );
  },
  {
    name: "delete_profile_reference",
    description:
      "删除一条参考素材。按列表下标 index（从 0 起）或参考图 image_url 定位；用户说某条参考不再适用时使用。",
    schema: z.object({
      image_url: z.string().optional(),
      index: z.number().int().min(0).optional(),
    }),
  },
);

export const REFERENCE_TOOLS = [
  parseReferenceText,
  parseReferenceImage,
  deleteProfileReferenceTool,
];
