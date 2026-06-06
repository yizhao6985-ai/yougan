/** 参考素材 tools：解析类仅入队 work node；删除类直接改 state */
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { z } from "zod";

import { deleteProfileReference } from "@yougan/domain";
import {
  getActiveTurnKind,
  getProfile,
  getReferences,
  getState,
  patchPendingProfile,
  patchPendingProfileMeta,
} from "#agent/state-io/index.js";
import { getLatestHumanMessageImageParts } from "#agent/messages/human.js";
import { extractImageUrlsFromParts } from "#agent/messages/content-parts.js";
import {
  listKnownReferenceImageUrls,
  resolveReferenceImageUrl,
} from "../../parse-reference-image/helpers/reference-images.js";

function requireProfileMode(config: object): string | null {
  if (getActiveTurnKind(getState()) !== "profile") {
    return "作品方案工具仅在 profile 模式可用。";
  }
  return null;
}

export const parseReferenceText = tool(
  async ({ reference_text }, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const gate = requireProfileMode(config);
    if (gate) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({ content: gate, tool_call_id: toolCallId }),
          ],
        },
      });
    }

    const state = getState();
    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: "已提交参考文案解析任务。",
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProfileMeta(state, {
          pendingParseReferenceText: reference_text,
        }),
      },
    });
  },
  {
    name: "parse_reference_text",
    description: "用户提供参考文案时，结构化提取要点写入 references。",
    schema: z.object({ reference_text: z.string() }),
  },
);

export const parseReferenceImage = tool(
  async ({ image_url, hint }, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const gate = requireProfileMode(config);
    if (gate) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({ content: gate, tool_call_id: toolCallId }),
          ],
        },
      });
    }

    const state = getState();
    const references = getReferences(state);
    const messageUrls = extractImageUrlsFromParts(
      getLatestHumanMessageImageParts(state.messages),
    );
    const knownUrls = listKnownReferenceImageUrls(references);
    const resolvedUrl = resolveReferenceImageUrl(
      image_url,
      messageUrls,
      knownUrls,
    );

    if (!resolvedUrl) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "未找到可解析的参考图片 URL。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    const existing = references.find(
      (item) => item.source_type === "image" && item.image_url === resolvedUrl,
    );
    if (existing?.summary?.trim() && !hint?.trim()) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "该参考图片已解析并写入 references。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: "已提交参考图片解析任务。",
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProfileMeta(state, {
          pendingParseReferenceImage: {
            image_url: resolvedUrl,
            hint: hint ?? null,
          },
        }),
      },
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

export const deleteProfileReferenceTool = tool(
  async ({ image_url, index }, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const gate = requireProfileMode(config);
    if (gate) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({ content: gate, tool_call_id: toolCallId }),
          ],
        },
      });
    }
    if (image_url == null && index == null) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "请提供 image_url 或 index。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    const state = getState();
    const profile = getProfile(state);
    const refs = profile.references ?? [];
    if (!refs.length) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "当前方案尚无参考素材。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    const next = deleteProfileReference(profile, { image_url, index });
    if (!next) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "未找到要删除的参考素材。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }
    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: `已删除参考素材（剩余 ${next.references?.length ?? 0} 条）。`,
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProfile(state, next),
      },
    });
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
