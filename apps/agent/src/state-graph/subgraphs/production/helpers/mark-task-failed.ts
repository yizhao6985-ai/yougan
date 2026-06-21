import { getProduction, patchPendingProductionFields } from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

export function markActiveTaskFailed(
  state: AgentStateType,
  taskId: string,
  failureMessage: string,
): AgentStatePatch {
  const plan = getProduction(state);
  return patchPendingProductionFields(state, {
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
  });
}
