/** 设计执行者：产出当前 in_progress 任务 */
import type { RunnableConfig } from "@langchain/core/runnables";

import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { runProductionExecutor } from "../../helpers/run-executor.js";

export async function executeDesignNode(
  state: AgentStateType,
  _config: RunnableConfig,
): Promise<AgentStatePatch | Partial<AgentStateType>> {
  const produced = await runProductionExecutor(state, "executeDesign");
  return produced ?? {};
}
