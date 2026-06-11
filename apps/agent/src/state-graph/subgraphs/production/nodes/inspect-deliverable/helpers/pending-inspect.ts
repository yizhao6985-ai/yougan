/** 标记 staging.meta.production 待质检及 inspect 管线 */
import type { ProductionDepartment, ProductionPlanTask } from "@yougan/domain";

import { patchPendingProductionMeta } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

function resolveTaskForDepartment(
  tasks: ProductionPlanTask[],
  department: ProductionDepartment,
): ProductionPlanTask | undefined {
  return (
    tasks.find((t) => t.department === department && t.status !== "completed") ??
    tasks.find((t) => t.department === department) ??
    tasks.find((t) => !t.status || t.status === "pending")
  );
}

export function markPendingInspect(
  state: AgentStateType,
  input: {
    taskId: string;
    pipeline: "writing" | "design";
  },
): ReturnType<typeof patchPendingProductionMeta> {
  return patchPendingProductionMeta(state, {
    inspectTaskId: input.taskId,
    pendingInspect: true,
    inspectPipeline: input.pipeline,
    inspectRetryCount: 0,
    lastInspectFeedback: null,
  });
}

export function markPendingInspectForDepartment(
  state: AgentStateType,
  tasks: ProductionPlanTask[],
  department: ProductionDepartment,
  pipeline: "writing" | "design",
): ReturnType<typeof patchPendingProductionMeta> | null {
  const task = resolveTaskForDepartment(tasks, department);
  if (!task) return null;
  return markPendingInspect(state, { taskId: task.id, pipeline });
}
