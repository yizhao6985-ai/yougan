/** 标记当前 in_progress 任务，供后续执行节点产出 */
import {
  getProduction,
  patchPendingProductionFields,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";
import { patchRunProgress } from "#agent/state-io/run-progress.js";

import {
  nextPendingTask,
  resolveDispatchTaskId,
  withActiveTask,
} from "../../helpers/task-plan.js";
import { productionDispatchProgress } from "../../helpers/progress-labels.js";

export async function dispatchTaskNode(
  state: AgentStateType,
): Promise<AgentStatePatch> {
  const plan = getProduction(state);
  const taskId = resolveDispatchTaskId(plan);
  if (!taskId) {
    return {};
  }

  const task =
    plan.pending_tasks.find((t) => t.id === taskId) ??
    nextPendingTask(plan);
  const progress = productionDispatchProgress(task?.description);

  return {
    ...patchPendingProductionFields(state, withActiveTask(plan, taskId)),
    ...patchRunProgress(progress),
  };
}
