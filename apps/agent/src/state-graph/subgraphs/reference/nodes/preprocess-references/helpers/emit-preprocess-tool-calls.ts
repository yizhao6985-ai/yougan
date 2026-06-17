import { AIMessage } from "@langchain/core/messages";
import { type MediaKind } from "@yougan/domain";
import { nanoid } from "nanoid";

import type { UnprocessedReferenceJob } from "./list-unprocessed-jobs.js";

export const PREPROCESS_REFERENCE_TOOL_NAMES = {
  text: "preprocess_reference_text",
  image: "preprocess_reference_image",
  audio: "preprocess_reference_audio",
  video: "preprocess_reference_video",
} as const satisfies Record<
  Exclude<MediaKind, "file">,
  string
>;

const PREPROCESS_KIND: Record<
  MediaKind,
  "text" | "image" | "audio" | "video" | null
> = {
  text: "text",
  image: "image",
  audio: "audio",
  video: "video",
  file: "text",
};

/** 为待预处理资源生成 tool_calls，由 runPreprocessTools 执行。 */
export function emitPreprocessToolCalls(
  jobs: UnprocessedReferenceJob[],
): AIMessage | null {
  const toolCalls: Array<{
    id: string;
    name: string;
    args: { asset_url: string };
  }> = [];

  for (const job of jobs) {
    const expectedKind = PREPROCESS_KIND[job.media_kind];
    if (!expectedKind) continue;

    const toolName =
      PREPROCESS_REFERENCE_TOOL_NAMES[
        expectedKind as keyof typeof PREPROCESS_REFERENCE_TOOL_NAMES
      ];

    toolCalls.push({
      id: nanoid(),
      name: toolName,
      args: { asset_url: job.asset_url },
    });
  }

  if (!toolCalls.length) return null;

  return new AIMessage({
    content: "",
    tool_calls: toolCalls,
  });
}
