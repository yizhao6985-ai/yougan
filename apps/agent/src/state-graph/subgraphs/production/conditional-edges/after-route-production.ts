/** routeProduction 之后：失败/卡住则 finalize；全部备妥则整合；否则回到 dispatch */
import { getProduction } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import {
  allTasksReady,
  productionHasTerminalFailure,
  productionPipelineStuck,
} from "../helpers/task-plan.js";

export const from = "routeProduction" as const;

export type AfterRouteProductionTarget =
  | "dispatchTask"
  | "assemblePreview"
  | "finalizeProduction";

export function selectAfterRouteProduction(
  state: AgentStateType,
): AfterRouteProductionTarget {
  const plan = getProduction(state);

  if (productionPipelineStuck(plan)) {
    return "finalizeProduction";
  }

  if (productionHasTerminalFailure(plan)) {
    return "finalizeProduction";
  }

  if (allTasksReady(plan)) {
    return "assemblePreview";
  }

  return "dispatchTask";
}

export const paths = {
  dispatchTask: "dispatchTask",
  assemblePreview: "assemblePreview",
  finalizeProduction: "finalizeProduction",
} as const;
