/** dispatchTask 之后：无计划则总结；待验收则 accept；否则执行或 routeProduction */
import { getProduction } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import { executorNodeForTask } from "../helpers/produce-task.js";
import {
  currentActiveTask,
  productionPlanIsEmpty,
  taskAwaitingAccept,
  taskNeedsProduce,
} from "../helpers/task-plan.js";

export const from = "dispatchTask" as const;

export type AfterDispatchTaskTarget =
  | "executeWriting"
  | "executeDesign"
  | "acceptTask"
  | "routeProduction"
  | "summarizeProduction";

export function selectAfterDispatchTask(
  state: AgentStateType,
): AfterDispatchTaskTarget {
  const production = getProduction(state);

  if (productionPlanIsEmpty(production)) {
    return "summarizeProduction";
  }

  if (production.pending_tasks.some(taskAwaitingAccept)) {
    return "acceptTask";
  }

  const task = currentActiveTask(production);
  if (!task || !taskNeedsProduce(task)) {
    return "routeProduction";
  }

  const executor = executorNodeForTask(task);
  if (executor === "executeDesign") return "executeDesign";
  return "executeWriting";
}

export const paths = {
  executeWriting: "executeWriting",
  executeDesign: "executeDesign",
  acceptTask: "acceptTask",
  routeProduction: "routeProduction",
  summarizeProduction: "summarizeProduction",
} as const;
