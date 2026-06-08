import { HumanMessage } from "@langchain/core/messages";

import { createChatModel } from "#agent/llm/providers/index.js";
import {
  humanImageFromUrl,
  type HumanImageBase64ContentPart,
} from "@yougan/domain";

function humanImageFromBase64(
  data: string,
  mimeType = "image/jpeg",
): HumanImageBase64ContentPart {
  return {
    type: "image",
    source_type: "base64",
    mime_type: mimeType,
    data,
  };
}

const VISION_PROMPT = `你是参考素材视觉感知助手。请客观描述画面内容、风格、构图、色调、镜头语气与可见文字。
要求：
- 只描述你能从画面确认的信息，不要猜测用户意图
- 3–8 句中文，条理清晰
- 不要输出 JSON`;

export async function describeImageUrl(url: string): Promise<string> {
  const llm = createChatModel({ temperature: 0.1 });
  const response = await llm.invoke(
    [
      new HumanMessage({
        content: [{ type: "text", text: VISION_PROMPT }, humanImageFromUrl(url)],
      }),
    ],
    { tags: ["nostream"] },
  );
  const text =
    typeof response.content === "string"
      ? response.content
      : Array.isArray(response.content)
        ? response.content
            .filter(
              (part) =>
                part &&
                typeof part === "object" &&
                (part as { type?: string }).type === "text",
            )
            .map((part) => (part as { text?: string }).text ?? "")
            .join("")
        : "";
  return text.trim();
}

export async function describeImageBuffers(
  frames: Buffer[],
): Promise<string> {
  if (!frames.length) return "";

  const llm = createChatModel({ temperature: 0.1 });
  const imageParts = frames.map((frame) =>
    humanImageFromBase64(frame.toString("base64"), "image/jpeg"),
  );

  const response = await llm.invoke(
    [
      new HumanMessage({
        content: [
          {
            type: "text",
            text: `${VISION_PROMPT}\n\n以下是从参考视频中抽取的 ${frames.length} 个关键帧，请综合描述画面风格与叙事视觉特征。`,
          },
          ...imageParts,
        ],
      }),
    ],
    { tags: ["nostream"] },
  );

  const text =
    typeof response.content === "string"
      ? response.content
      : Array.isArray(response.content)
        ? response.content
            .filter(
              (part) =>
                part &&
                typeof part === "object" &&
                (part as { type?: string }).type === "text",
            )
            .map((part) => (part as { text?: string }).text ?? "")
            .join("")
        : "";
  return text.trim();
}
