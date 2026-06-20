/** dispatchTask 之后：无计划则直接总结；否则进入执行（design / audio 入库 / 文案） */
import { getProduction } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import {
  audioTaskNeedsIngestProduce,
  currentActiveTask,
  isDesignTask,
  productionHasTerminalFailure,
  productionPlanIsEmpty,
  taskNeedsProduce,
  taskNeedsRender,
} from "../helpers/task-plan.js";

export const from = "dispatchTask" as const;

export type AfterDispatchTaskTarget =
  | "executeWriting"
  | "executeDesign"
  | "ingestProductionAudio"
  | "summarizeProduction";

export function selectAfterDispatchTask(
  state: AgentStateType,
): AfterDispatchTaskTarget {
  const production = getProduction(state);

  if (productionPlanIsEmpty(production)) {
    return "summarizeProduction";
  }

  const task = currentActiveTask(production);
  if (!task || productionHasTerminalFailure(production)) {
    return "summarizeProduction";
  }

  if (
    isDesignTask(task) &&
    (taskNeedsProduce(task) || taskNeedsRender(task))
  ) {
    return "executeDesign";
  }

  if (audioTaskNeedsIngestProduce(state, task)) {
    return "ingestProductionAudio";
  }

  if (!taskNeedsProduce(task)) {
    return "summarizeProduction";
  }

  return "executeWriting";
}

export const paths = {
  executeWriting: "executeWriting",
  executeDesign: "executeDesign",
  ingestProductionAudio: "ingestProductionAudio",
  summarizeProduction: "summarizeProduction",
} as const;
