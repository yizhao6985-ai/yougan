/** 参考素材按媒介预处理的原子工具 */
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { assetFromUrl } from "@yougan/domain";
import { z } from "zod";

import {
  getState,
  patchPendingReferences,
} from "#agent/state-io/index.js";

import { executeReferencePreprocess } from "./helpers/execute-preprocess.js";
import { PREPROCESS_REFERENCE_TOOL_NAMES } from "../../preprocess-references/helpers/emit-preprocess-tool-calls.js";

const assetUrlSchema = z.object({
  asset_url: z.string().min(1).describe("待预处理资源的 URL，从待处理列表原样复制"),
});

function assetFromPreprocessInput(input: {
  asset_url: string;
  mime_type?: string;
  original_name?: string;
}) {
  const url = input.asset_url.trim();
  return assetFromUrl(url, {
    mime_type: input.mime_type,
    original_name: input.original_name,
  });
}

function formatPreprocessMessage(summary: string): string {
  return `已完成预处理：${summary.slice(0, 160)}${summary.length > 160 ? "…" : ""}`;
}

function preprocessTool(
  name: string,
  description: string,
  expectedKind: "text" | "image" | "audio" | "video",
) {
  return tool(
    async (input, config) => {
      const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
      const asset = assetFromPreprocessInput(input);
      const result = await executeReferencePreprocess(asset, expectedKind);

      if (!result.ok) {
        return new Command({
          update: {
            messages: [
              new ToolMessage({
                content: result.message,
                tool_call_id: toolCallId,
              }),
            ],
          },
        });
      }

      const state = getState();
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: formatPreprocessMessage(result.summary),
              tool_call_id: toolCallId,
            }),
          ],
          ...patchPendingReferences(state, result.references),
        },
      });
    },
    { name, description, schema: assetUrlSchema },
  );
}

export const preprocessReferenceText = preprocessTool(
  PREPROCESS_REFERENCE_TOOL_NAMES.text,
  "预处理文本参考：读取正文并生成客观分析摘要。",
  "text",
);

export const preprocessReferenceImage = preprocessTool(
  PREPROCESS_REFERENCE_TOOL_NAMES.image,
  "预处理图片参考：视觉感知并生成客观分析摘要。",
  "image",
);

export const preprocessReferenceAudio = preprocessTool(
  PREPROCESS_REFERENCE_TOOL_NAMES.audio,
  "预处理音频参考：转写并生成客观分析摘要。",
  "audio",
);

export const preprocessReferenceVideo = preprocessTool(
  PREPROCESS_REFERENCE_TOOL_NAMES.video,
  "预处理视频参考：关键帧与转写并生成客观分析摘要。",
  "video",
);
