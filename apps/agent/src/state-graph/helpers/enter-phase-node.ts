import type { RunProgressPhase } from "@yougan/domain";

import { patchRunProgress } from "#agent/state-io/run-progress.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

/** 子图 / 阶段入口：同步写入粗步骤 runProgress */
export function createEnterPhaseNode(phase: RunProgressPhase) {
  return async function enterPhaseNode(
    _state: AgentStateType,
  ): Promise<AgentStatePatch> {
    return patchRunProgress(phase);
  };
}
