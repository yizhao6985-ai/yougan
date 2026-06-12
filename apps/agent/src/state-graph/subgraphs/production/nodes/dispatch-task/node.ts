/** 标记当前 in_progress 任务，供后续执行节点产出 */
import {
  getProduction,
  patchPendingProductionFields,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import {
  resolveDispatchTaskId,
  withActiveTask,
} from "../../helpers/task-plan.js";

export async function dispatchTaskNode(
  state: AgentStateType,
): Promise<AgentStatePatch> {
  const plan = getProduction(state);
  const taskId = resolveDispatchTaskId(plan);
  if (!taskId) {
    return {};
  }

  return patchPendingProductionFields(state, withActiveTask(plan, taskId));
}
