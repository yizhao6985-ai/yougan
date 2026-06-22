/** 标记当前 in_progress 任务，供后续执行节点产出 */
import {
  getProduction,
  patchPendingProductionFields,
} from "#agent/state-io/index.js";
import {
  productionTaskActivityId,
  upsertTurnActivity,
} from "#agent/state-io/turn-activities.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import {
  nextPendingTask,
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

  const task = plan.pending_tasks.find((t) => t.id === taskId);
  if (!task) {
    return {};
  }

  return {
    ...patchPendingProductionFields(state, withActiveTask(plan, taskId)),
    ...upsertTurnActivity({
      id: productionTaskActivityId(taskId),
      refId: taskId,
      kind: "production_step",
      status: "running",
      subject: task.description,
    }),
  };
}
