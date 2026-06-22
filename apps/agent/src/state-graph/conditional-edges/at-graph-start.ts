import type { AgentStateType } from "#agent/state.js";

/** START：进入回合队列规划 */
export type AtGraphStartTarget = "setTurnPlanningProgress";

export function selectAtGraphStart(
  _state: AgentStateType,
): AtGraphStartTarget {
  return "setTurnPlanningProgress";
}

export const paths: AtGraphStartTarget[] = ["setTurnPlanningProgress"];
