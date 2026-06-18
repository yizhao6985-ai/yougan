import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import { getWriter } from "@langchain/langgraph";
import type { AiUsageSnapshot } from "@yougan/domain";

import type { AgentStatePatch } from "#agent/state.js";

/** 与前端 onCustomEvent 约定的事件名 */
export const AI_USAGE_EVENT = "ai_usage" as const;

export type AiUsageCustomPayload = {
  event: typeof AI_USAGE_EVENT;
  aiUsage: AiUsageSnapshot;
};

export function emitAiUsage(
  aiUsage: AiUsageSnapshot,
  config?: LangGraphRunnableConfig,
): void {
  const writer = getWriter(config);
  if (!writer) return;
  const payload: AiUsageCustomPayload = {
    event: AI_USAGE_EVENT,
    aiUsage,
  };
  writer(payload);
}

export function patchAiUsage(aiUsage: AiUsageSnapshot): AgentStatePatch {
  return { aiUsage };
}

export function isAiUsageCustomPayload(
  data: unknown,
): data is AiUsageCustomPayload {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  if (record.event !== AI_USAGE_EVENT) return false;
  const aiUsage = record.aiUsage;
  return aiUsage != null && typeof aiUsage === "object";
}
