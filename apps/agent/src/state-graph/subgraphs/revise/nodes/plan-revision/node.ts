import type { RunnableConfig } from "@langchain/core/runnables";

import {
  buildRunProgress,
  patchRunProgress,
  withRunProgressHeartbeat,
} from "#agent/state-io/run-progress.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

export async function planRevisionNode(
  _state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const progress = buildRunProgress("revise_plan", "正在整理改稿方案…");
  return withRunProgressHeartbeat(progress, config, async () => ({
    ...patchRunProgress(progress),
  }));
}
