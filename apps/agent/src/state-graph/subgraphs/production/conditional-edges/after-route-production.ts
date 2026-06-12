/** routeProduction 之后：终局失败则总结，全部备妥则整理，否则继续分发 */
import { getProduction } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import {
  allTasksReady,
  productionHasTerminalFailure,
} from "../helpers/task-plan.js";

export const from = "routeProduction" as const;

export type AfterRouteProductionTarget =
  | "dispatchTask"
  | "assemblePreview"
  | "summarizeProduction";

export function selectAfterRouteProduction(
  state: AgentStateType,
): AfterRouteProductionTarget {
  const plan = getProduction(state);

  if (productionHasTerminalFailure(plan)) {
    return "summarizeProduction";
  }

  if (allTasksReady(plan)) {
    return "assemblePreview";
  }

  return "dispatchTask";
}

export const paths = {
  dispatchTask: "dispatchTask",
  assemblePreview: "assemblePreview",
  summarizeProduction: "summarizeProduction",
} as const;
