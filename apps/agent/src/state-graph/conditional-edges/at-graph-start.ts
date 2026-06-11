import type { AgentStateType } from "#agent/state.js";

export type AtGraphStartTarget = "planTurnQueue";

/** START：统一走 planTurnQueue（开屏仅 suggestions 队列） */
export function selectAtGraphStart(
  _state: AgentStateType,
): AtGraphStartTarget {
  return "planTurnQueue";
}

export const paths: AtGraphStartTarget[] = ["planTurnQueue"];
