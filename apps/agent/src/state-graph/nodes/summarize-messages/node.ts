/** 回合末：对话 messages 过长则滚动摘要，否则无操作 */
import type { RunnableConfig } from "@langchain/core/runnables";
import type { NodeError } from "@langchain/langgraph";

import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { rethrowUnlessRecoverable } from "../../helpers/recoverable-node-error.js";
import {
  resolveConversationSummary,
  summarizeConversationTimeoutFallback,
} from "./helpers/summarize-conversation.js";

export async function summarizeMessagesNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const patch = await resolveConversationSummary(state, config);
  return { ...(patch ?? {}), ...patchAiUsageMetering(state.aiUsage, config) };
}

export function summarizeMessagesErrorHandler(
  state: AgentStateType,
  error: NodeError,
): AgentStatePatch {
  rethrowUnlessRecoverable(error);
  return { ...(summarizeConversationTimeoutFallback(state) ?? {}) };
}
