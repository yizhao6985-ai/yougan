/**
 * 参考素材工具（三模式共用）：解析文案/图片，结果追加到 profile.references。
 */
import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { createChatModel } from "../llm/minimax.js";
import type { ReferenceItem } from "../schemas.js";
import { parseProfile } from "../state.js";
import { getState, mergeProfileReferences, toolCommand } from "./common.js";

export const parseReferenceText = tool(
  async ({ reference_text }, config) => {
    const llm = createChatModel({ temperature: 0.2 });
    const response = await llm.invoke([
      new HumanMessage(
        `提取参考文案的结构、语气、关键词，输出简洁中文摘要。\n\n${reference_text}`,
      ),
    ]);
    const summary = String(response.content).slice(0, 500);
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
    const llm = createChatModel({ temperature: 0.2 });
    const response = await llm.invoke([
      new HumanMessage({
        content: [
          {
            type: "text",
            text: `描述这张参考图的风格、构图、色调，用于后续创作参考。${hint ?? ""}`,
          },
          { type: "image_url", image_url: { url: image_url } },
        ],
      }),
    ]);
    const summary = String(response.content).slice(0, 500);
    const item: ReferenceItem = {
      source_type: "image",
      summary,
      image_url,
    };
    const profile = mergeProfileReferences(parseProfile(getState()), [item]);
    return toolCommand(config, "已解析参考图片并写入 references。", {
      profile,
    });
  },
  {
    name: "parse_reference_image",
    description: "用户提供参考图片 URL 时，解析视觉风格。",
    schema: z.object({
      image_url: z.string(),
      hint: z.string().optional().default(""),
    }),
  },
);

export const REFERENCE_TOOLS = [parseReferenceText, parseReferenceImage];
