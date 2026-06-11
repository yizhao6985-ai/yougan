/** 参考素材按媒介预处理的原子工具 */
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { z } from "zod";

import {
  assetFromPreprocessInput,
  executeReferencePreprocess,
  patchAfterPreprocess,
} from "./helpers/execute-preprocess.js";

const assetUrlSchema = z.object({
  asset_url: z.string().min(1).describe("待预处理资源的 URL，从待处理列表原样复制"),
});

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

      const { message, ...patch } = patchAfterPreprocess(result.summary);
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: message,
              tool_call_id: toolCallId,
            }),
          ],
          ...patch,
        },
      });
    },
    { name, description, schema: assetUrlSchema },
  );
}

export const preprocessReferenceText = preprocessTool(
  "preprocess_reference_text",
  "预处理文本参考：读取正文并生成客观分析摘要。",
  "text",
);

export const preprocessReferenceImage = preprocessTool(
  "preprocess_reference_image",
  "预处理图片参考：视觉感知并生成客观分析摘要。",
  "image",
);

export const preprocessReferenceAudio = preprocessTool(
  "preprocess_reference_audio",
  "预处理音频参考：转写并生成客观分析摘要。",
  "audio",
);

export const preprocessReferenceVideo = preprocessTool(
  "preprocess_reference_video",
  "预处理视频参考：关键帧与转写并生成客观分析摘要。",
  "video",
);
