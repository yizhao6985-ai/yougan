/** 执行者节点：产出当前 in_progress 任务 */
import { getProduction } from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import {
  executorNodeForTask,
  produceNextTask,
  type ProductionExecutorId,
} from "./produce-task.js";
import { currentActiveTask, taskNeedsProduce } from "./task-plan.js";

function shouldProduce(
  state: AgentStateType,
  executor: ProductionExecutorId,
): boolean {
  const task = currentActiveTask(getProduction(state));
  if (!task || executorNodeForTask(task) !== executor) {
    return false;
  }
  return taskNeedsProduce(task);
}

export async function runProductionExecutor(
  state: AgentStateType,
  executor: ProductionExecutorId,
): Promise<AgentStatePatch | null> {
  if (!shouldProduce(state, executor)) {
    return null;
  }
  return produceNextTask(state, executor);
}
