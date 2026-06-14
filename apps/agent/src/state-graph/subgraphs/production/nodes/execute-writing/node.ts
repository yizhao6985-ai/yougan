/** 文案执行者：产出当前 in_progress 任务 */
import type { RunnableConfig } from "@langchain/core/runnables";

import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { produceNextTask } from "./helpers/produce-task.js";

export async function executeWritingNode(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<AgentStatePatch> {
  return produceNextTask(state, "executeWriting", config);
}
