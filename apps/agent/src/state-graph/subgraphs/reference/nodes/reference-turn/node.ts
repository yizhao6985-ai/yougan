/**
 * reference 子图单节点：先感知附件 → 统一结构化归纳 → 再对话（删参考等）。
 * tool 回路再次进入时，分析步骤会因去重而跳过。
 */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { env } from "#agent/env.js";
import { invokeStructured, streamChat } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import {
  getReferences,
  patchPendingReferences,
} from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";
import {
  newWorkReference,
  upsertAssetReference,
  type ReferenceAnalysis,
} from "@yougan/domain";

import { listAttachmentAnalyzeRequests } from "../../helpers/attachment-requests.js";
import { perceiveReference } from "../../perception/perceive-reference.js";
import { buildAnalyzeReferencePrompt } from "../analyze-reference/prompt.js";
import { ReferenceAnalyzeSchema } from "../analyze-reference/schema.js";
import { REFERENCE_TOOLS } from "../tool-node/tools/index.js";
import { buildReferencePrompt } from "./prompt.js";

const llmWithTools = createChatModel({
  temperature: env.llmTemperature,
}).bindTools(REFERENCE_TOOLS);

function mergePerceptionIntoAnalysis(
  parsed: ReferenceAnalysis,
  perception: Awaited<ReturnType<typeof perceiveReference>>,
): ReferenceAnalysis {
  return {
    ...parsed,
    transcript: parsed.transcript?.trim() || perception.transcript?.trim() || undefined,
    visual_cues:
      parsed.visual_cues?.trim() ||
      perception.visual_description?.trim() ||
      undefined,
  };
}

async function analyzePendingAttachments(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const requests = listAttachmentAnalyzeRequests(state);
  if (!requests.length) return {};

  const llm = createChatModel({ temperature: 0.2 });
  let references = getReferences(state);

  for (const request of requests) {
    const perception = await perceiveReference({
      content: request.content,
      assetUrl:
        request.content.kind === "asset"
          ? request.content.asset.url
          : null,
      user_context: request.user_context,
    });

    const parsed = await invokeStructured(
      llm,
      ReferenceAnalyzeSchema,
      [new HumanMessage(buildAnalyzeReferencePrompt(perception))],
      { name: "reference_process_attachments" },
    );

    const analyzedAt = new Date().toISOString();
    const reference = newWorkReference({
      content: request.content,
      analysis: mergePerceptionIntoAnalysis(parsed.analysis, perception),
      intent: parsed.intent,
      analyzed_at: analyzedAt,
    });

    references =
      reference.content.kind === "asset"
        ? upsertAssetReference(references, reference)
        : [...references, reference];
  }

  return patchPendingReferences(state, references);
}

export async function referenceTurnNode(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<Partial<AgentStateType>> {
  const analyzePatch = await analyzePendingAttachments(state);
  const nextState = analyzePatch.staging
    ? { ...state, staging: analyzePatch.staging }
    : state;

  const response = await streamChat(
    llmWithTools,
    [
      new SystemMessage(buildReferencePrompt(nextState)),
      ...(nextState.messages ?? []),
    ],
    config,
  );

  return {
    ...analyzePatch,
    messages: [response],
  };
}
