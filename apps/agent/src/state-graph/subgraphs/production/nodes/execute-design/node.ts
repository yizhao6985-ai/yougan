/** 设计执行者：产出当前 in_progress 任务 */
import type { RunnableConfig } from "@langchain/core/runnables";

import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { produceNextTask } from "../execute-writing/helpers/produce-task.js";

export async function executeDesignNode(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<AgentStatePatch> {
  return produceNextTask(state, "executeDesign", config);
}
