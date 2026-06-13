/**
 * 回合结束统一刷 LLM 计量到 state.runMetering（含未结算残留 + 本轮 acc）。
 * stream 结束后由 API settleAiUsage 扣费并清空 runMetering。
 */
import type { RunnableConfig } from "@langchain/core/runnables";
import { EMPTY_RUN_METERING, mergeRunMetering } from "@yougan/domain";

import {
  flushRunMeteringAccumulator,
  resetRunMeteringAccumulator,
} from "#agent/llm/invoke/metering.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

export async function finalizeRunMeteringNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const flushed = flushRunMeteringAccumulator(config);
  resetRunMeteringAccumulator(config);

  const runMetering =
    flushed.microCredits > 0 || flushed.callCount > 0
      ? mergeRunMetering(state.runMetering ?? EMPTY_RUN_METERING, flushed)
      : (state.runMetering ?? EMPTY_RUN_METERING);

  return { runMetering };
}
