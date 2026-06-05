/** 标记 staging.meta.production 待质检及 inspect 管线（design vs writing） */
import type { ProductionDepartment, ProductionPlanTask } from "@yougan/domain";

import { patchStagingProductionMeta } from "#agent/lib/staging-state.js";
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

export function markProductionPendingInspect(
  state: AgentStateType,
  input: {
    taskId: string;
    pipeline: "writing" | "design";
  },
): ReturnType<typeof patchStagingProductionMeta> {
  return patchStagingProductionMeta(state, {
    inspectTaskId: input.taskId,
    pendingInspect: true,
    inspectPipeline: input.pipeline,
    inspectRetryCount: 0,
    lastInspectFeedback: null,
  });
}

export function markDepartmentTaskPendingInspect(
  state: AgentStateType,
  tasks: ProductionPlanTask[],
  department: ProductionDepartment,
  pipeline: "writing" | "design",
): ReturnType<typeof patchStagingProductionMeta> | null {
  const task = resolveTaskForDepartment(tasks, department);
  if (!task) return null;
  return markProductionPendingInspect(state, { taskId: task.id, pipeline });
}
