/**
 * summarize-references：末位 LLM，批量写 intent.summary 并回复感友。
 */
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import {
  deriveReferenceDelta,
  isPendingReferenceIntent,
  PENDING_REFERENCE_INTENT_SUMMARY,
} from "@yougan/domain";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import {
  getLatestHumanMessageText,
} from "#agent/messages/human.js";
import {
  getReferences,
  patchPendingReferences,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { buildSummarizeReferencesPrompt } from "./prompt.js";
import { ReferenceTurnSummarySchema } from "./schema.js";

function stripIntentUserContext(intent: {
  summary: string;
  user_context?: string;
}) {
  return { summary: intent.summary.trim() };
}

export async function summarizeReferencesNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const staging = getReferences(state);
  const committed = state.references ?? [];
  const delta = deriveReferenceDelta(committed, staging);
  const userMessage = getLatestHumanMessageText(state.messages).trim();

  const needsWork =
    delta.added.length > 0 ||
    delta.removed.length > 0 ||
    delta.toSummarize.length > 0 ||
    delta.toPrompt.length > 0 ||
    Boolean(userMessage);

  if (!needsWork) {
    return {
      messages: [new AIMessage("参考素材暂无变更。")],
    };
  }

  const llm = createChatModel({ temperature: 0.2 });
  const summary = await invokeStructured(
    llm,
    ReferenceTurnSummarySchema,
    [
      new HumanMessage(
        buildSummarizeReferencesPrompt({
          references: staging,
          user_message: userMessage,
          added: delta.added,
          removed: delta.removed,
          to_summarize: delta.toSummarize,
          to_prompt: delta.toPrompt,
        }),
      ),
    ],
    { name: "reference_summarize_turn" },
    config,
  );

  const intentById = new Map(
    (summary.intents ?? []).map((item) => [item.reference_id, item]),
  );

  const next = staging.map((ref) => {
    const item = intentById.get(ref.id);
    if (!item) {
      if (ref.intent.user_context) {
        return { ...ref, intent: stripIntentUserContext(ref.intent) };
      }
      return ref;
    }

    const nextSummary =
      item.status === "pending" || isPendingReferenceIntent({ summary: item.summary })
        ? PENDING_REFERENCE_INTENT_SUMMARY
        : item.summary.trim();

    return {
      ...ref,
      intent: { summary: nextSummary },
    };
  });

  return {
    ...patchPendingReferences(state, next),
    messages: [new AIMessage(summary.reply)],
  };
}
