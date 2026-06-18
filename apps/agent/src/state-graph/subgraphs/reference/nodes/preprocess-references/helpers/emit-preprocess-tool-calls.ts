import { AIMessage } from "@langchain/core/messages";
import { type MediaKind } from "@yougan/domain";
import { nanoid } from "nanoid";

import type { UnprocessedReferenceJob } from "./list-unprocessed-jobs.js";
import { isSupportedReferencePreprocessKind } from "./skip-unsupported-reference-jobs.js";

export const PREPROCESS_REFERENCE_TOOL_NAMES = {
  text: "preprocess_reference_text",
  image: "preprocess_reference_image",
} as const;

type PreprocessToolKind = keyof typeof PREPROCESS_REFERENCE_TOOL_NAMES;

const PREPROCESS_KIND: Record<MediaKind, PreprocessToolKind | null> = {
  text: "text",
  image: "image",
  audio: null,
  video: null,
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
    if (!isSupportedReferencePreprocessKind(job.media_kind)) continue;

    const expectedKind = PREPROCESS_KIND[job.media_kind];
    if (!expectedKind) continue;

    toolCalls.push({
      id: nanoid(),
      name: PREPROCESS_REFERENCE_TOOL_NAMES[expectedKind],
      args: { asset_url: job.asset_url },
    });
  }

  if (!toolCalls.length) return null;

  return new AIMessage({
    content: "",
    tool_calls: toolCalls,
  });
}
