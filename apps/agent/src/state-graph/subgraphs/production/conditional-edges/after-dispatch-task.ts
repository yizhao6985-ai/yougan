/** dispatchTask 之后：无计划则直接总结；否则进入执行（验收与流转在 execute → accept → route） */
import { getProduction } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import { executorNodeForTask } from "../nodes/execute-writing/helpers/produce-task.js";
import {
  currentActiveTask,
  productionHasTerminalFailure,
  productionPlanIsEmpty,
  taskNeedsProduce,
} from "../helpers/task-plan.js";

export const from = "dispatchTask" as const;

export type AfterDispatchTaskTarget =
  | "executeWriting"
  | "executeDesign"
  | "summarizeProduction";

export function selectAfterDispatchTask(
  state: AgentStateType,
): AfterDispatchTaskTarget {
  const production = getProduction(state);

  if (productionPlanIsEmpty(production)) {
    return "summarizeProduction";
  }

  const task = currentActiveTask(production);
  if (
    !task ||
    !taskNeedsProduce(task) ||
    productionHasTerminalFailure(production)
  ) {
    return "summarizeProduction";
  }

  const executor = executorNodeForTask(task);
  if (executor === "executeDesign") return "executeDesign";
  return "executeWriting";
}

export const paths = {
  executeWriting: "executeWriting",
  executeDesign: "executeDesign",
  summarizeProduction: "summarizeProduction",
} as const;
