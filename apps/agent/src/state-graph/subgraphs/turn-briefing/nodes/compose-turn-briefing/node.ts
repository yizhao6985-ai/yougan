/** 流式撰写回合简报（turn_briefing AIMessage） */
import type { RunnableConfig } from "@langchain/core/runnables";

import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { resolveTurnBriefingMessage } from "./resolve-turn-briefing.js";

export async function composeTurnBriefingNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  if (state.turn.cancelled) {
    return {};
  }

  const message = await resolveTurnBriefingMessage(state, config);
  if (!message) return {};

  return {
    messages: [message],
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}
