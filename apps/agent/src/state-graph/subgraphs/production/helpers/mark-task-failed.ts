import { getProduction, patchPendingProductionFields } from "#agent/state-io/index.js";
import {
  productionTaskActivityId,
  upsertTurnActivity,
} from "#agent/state-io/turn-activities.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

export function markActiveTaskFailed(
  state: AgentStateType,
  taskId: string,
  failureMessage: string,
): AgentStatePatch {
  const plan = getProduction(state);
  const task = plan.pending_tasks.find((t) => t.id === taskId);
  return {
    ...patchPendingProductionFields(state, {
      ...plan,
      pending_tasks: plan.pending_tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: "failed" as const,
              deliverable: null,
              feedback: null,
              failure_message: failureMessage,
            }
          : t,
      ),
    }),
    ...(task
      ? upsertTurnActivity({
          id: productionTaskActivityId(taskId),
          refId: taskId,
          kind: "production_step",
          status: "failed",
          subject: task.description,
        })
      : {}),
  };
}
