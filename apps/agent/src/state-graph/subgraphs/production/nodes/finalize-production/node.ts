/** 创作回合末：成稿摘要或失败说明写入对话 */
import { AIMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { getPreview, getProduction } from "#agent/state-io/index.js";
import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { buildProductionFinalizeMessage } from "./helpers/finalize-outcome.js";

export async function finalizeProductionNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const content = buildProductionFinalizeMessage(
    getProduction(state),
    getPreview(state),
  );
  return {
    messages: [new AIMessage(content)],
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}
