import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

import { invokeStructured } from "#agent/llm/invoke/index.js";

import type { ReferenceAnalyzeRequest } from "./pending-requests.js";
import { buildAnalyzeReferenceMessage } from "./analyze-prompt.js";
import {
  finalizeReferenceAnalysis,
  prepareReferenceAsset,
} from "./prepare-asset.js";
import {
  ReferenceAnalyzeSchema,
  type ReferenceAnalyzeResult,
} from "./analyze-schema.js";

export async function analyzeReferenceAsset(
  request: ReferenceAnalyzeRequest,
  llm: BaseChatModel,
): Promise<ReferenceAnalyzeResult> {
  const prep = await prepareReferenceAsset(request);
  const parsed = await invokeStructured(
    llm,
    ReferenceAnalyzeSchema,
    [buildAnalyzeReferenceMessage(prep)],
    { name: "reference_analyze_asset" },
  );

  return {
    ...parsed,
    analysis: finalizeReferenceAnalysis(parsed.analysis, prep),
  };
}
