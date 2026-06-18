import type { AgentStateType } from "#agent/state.js";

export type AtGraphStartTarget = "planTurnQueue";

/** START：进入回合队列规划 */
export function selectAtGraphStart(
  _state: AgentStateType,
): AtGraphStartTarget {
  return "planTurnQueue";
}

export const paths: AtGraphStartTarget[] = ["planTurnQueue"];
