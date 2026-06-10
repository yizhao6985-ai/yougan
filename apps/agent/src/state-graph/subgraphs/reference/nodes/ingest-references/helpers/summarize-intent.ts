import { HumanMessage } from "@langchain/core/messages";
import type { ReferenceAnalysis, ReferenceIntent } from "@yougan/domain";
import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";

import {
  PENDING_REFERENCE_INTENT_SUMMARY,
  ReferenceIntentSummarizeSchema,
  type ReferenceIntentSummarizeResult,
} from "./intent-schema.js";
import { buildSummarizeIntentPrompt } from "./summarize-intent-prompt.js";

export function pendingReferenceIntent(): ReferenceIntent {
  return { summary: PENDING_REFERENCE_INTENT_SUMMARY };
}

export function isPendingReferenceIntent(intent: ReferenceIntent): boolean {
  return intent.summary.trim() === PENDING_REFERENCE_INTENT_SUMMARY;
}

/** 统一 intent 归纳：上传 ingest 与 patch 更新共用 */
export async function summarizeReferenceIntent(input: {
  analysis: ReferenceAnalysis;
  user_context?: string | null;
}): Promise<ReferenceIntentSummarizeResult> {
  const context = input.user_context?.trim();
  if (!context) {
    return {
      summary: PENDING_REFERENCE_INTENT_SUMMARY,
      status: "pending",
    };
  }

  const llm = createChatModel({ temperature: 0.2 });
  return invokeStructured(
    llm,
    ReferenceIntentSummarizeSchema,
    [
      new HumanMessage(
        buildSummarizeIntentPrompt({
          analysis: input.analysis,
          user_context: context,
        }),
      ),
    ],
    { name: "reference_summarize_intent" },
  );
}

export function toReferenceIntent(
  result: ReferenceIntentSummarizeResult,
): ReferenceIntent {
  return { summary: result.summary.trim() };
}
