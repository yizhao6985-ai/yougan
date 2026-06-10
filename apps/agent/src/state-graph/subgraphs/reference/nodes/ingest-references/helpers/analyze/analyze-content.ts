import type { ReferenceAnalysis } from "@yougan/domain";
import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createMultimodalChatModel } from "#agent/llm/providers/index.js";

import type { ReferenceAssetPrep } from "../prepare/types.js";
import { buildAnalyzeReferenceMessage } from "./analyze-prompt.js";
import { ReferenceContentAnalyzeSchema } from "./analyze-schema.js";

function finalizeReferenceAnalysis(
  parsed: ReferenceAnalysis,
  prep: ReferenceAssetPrep,
): ReferenceAnalysis {
  return {
    ...parsed,
    transcript:
      prep.transcript?.trim() || parsed.transcript?.trim() || undefined,
    visual_cues: parsed.visual_cues?.trim() || undefined,
  };
}

export async function analyzeReferenceContent(
  prep: ReferenceAssetPrep,
): Promise<ReferenceAnalysis> {
  const llm = createMultimodalChatModel({ temperature: 0.2 });
  const parsed = await invokeStructured(
    llm,
    ReferenceContentAnalyzeSchema,
    [buildAnalyzeReferenceMessage(prep)],
    { name: "reference_analyze_content" },
  );

  return finalizeReferenceAnalysis(parsed, prep);
}
