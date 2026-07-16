/** dispatchTask 之后：无计划则结束；否则进入文案执行 */
import { END } from "@langchain/langgraph";

import { getProduction } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import {
  currentActiveTask,
  productionHasTerminalFailure,
  productionPlanIsEmpty,
  taskNeedsProduce,
} from "../helpers/task-plan.js";

export const from = "dispatchTask" as const;

export type AfterDispatchTaskTarget = "executeWriting" | "__end__";

export function selectAfterDispatchTask(
  state: AgentStateType,
): AfterDispatchTaskTarget {
  const production = getProduction(state);

  if (productionPlanIsEmpty(production)) {
    return "__end__";
  }

  const task = currentActiveTask(production);
  if (!task || productionHasTerminalFailure(production)) {
    return "__end__";
  }

  if (!taskNeedsProduce(task)) {
    return "__end__";
  }

  return "executeWriting";
}

export const paths = {
  executeWriting: "executeWriting",
  __end__: END,
} as const;
