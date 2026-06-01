/**
 * 参考素材工具（三模式共用）：解析文案/图片，结果追加到 profile.references。
 */
import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { createChatModel } from "../llm/dashscope.js";
import type { ReferenceItem } from "../schema.js";
import { parseProfile } from "../lib/parse-agent-state.js";
import { truncateMessageContent } from "../lib/message-content.js";
import {
  getLatestHumanMessageImageUrls,
  listKnownReferenceImageUrls,
  resolveReferenceImageUrl,
  upsertImageReference,
} from "../lib/reference-images.js";
import { getState, mergeProfileReferences } from "../lib/tool-state.js";
import { toolCommand } from "../lib/tool-command.js";

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
    const profile = mergeProfileReferences(parseProfile(getState()), [item]);
    return toolCommand(config, "已解析参考文案并写入 references。", {
      profile,
    });
  },
  {
    name: "parse_reference_text",
    description: "用户提供参考文案时，结构化提取要点写入 profile.references。",
    schema: z.object({ reference_text: z.string() }),
  },
);

export const parseReferenceImage = tool(
  async ({ image_url, hint }, config) => {
    const state = getState();
    const profile = parseProfile(state);
    const messageUrls = getLatestHumanMessageImageUrls(state.messages);
    const knownUrls = listKnownReferenceImageUrls(profile);
    const resolvedUrl = resolveReferenceImageUrl(
      image_url,
      messageUrls,
      knownUrls,
    );

    if (!resolvedUrl) {
      return toolCommand(config, "未找到可解析的参考图片 URL。");
    }

    const existing = profile.references?.find(
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
    const nextProfile = upsertImageReference(profile, item);
    return toolCommand(config, "已解析参考图片并写入 references。", {
      profile: nextProfile,
    });
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

export const REFERENCE_TOOLS = [parseReferenceText, parseReferenceImage];
