/**
 * Agent 调用结束：将内存中未刷入的计量合并进 aiUsage.settledMicroCredits。
 */
import type { RunnableConfig } from "@langchain/core/runnables";

import {
  patchAiUsageMetering,
  resetRunMeteringAccumulator,
} from "#agent/llm/invoke/metering.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";
import { clearRunProgressPatch } from "#agent/state-io/run-progress.js";

export async function finalizeRunMeteringNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const meteringPatch = patchAiUsageMetering(state.aiUsage, config);
  resetRunMeteringAccumulator(config);

  return {
    ...meteringPatch,
    ...clearRunProgressPatch(),
  };
}
