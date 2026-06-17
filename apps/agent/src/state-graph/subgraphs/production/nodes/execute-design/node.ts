/** 设计执行者：产出当前 in_progress 任务的文生图 prompt */
import type { RunnableConfig } from "@langchain/core/runnables";

import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { produceDesignTask } from "./helpers/produce-design-task.js";

export async function executeDesignNode(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<AgentStatePatch> {
  return produceDesignTask(state, config);
}
