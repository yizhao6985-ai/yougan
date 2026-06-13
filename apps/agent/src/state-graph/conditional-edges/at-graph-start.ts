import type { AgentStateType } from "#agent/state.js";

export type AtGraphStartTarget = "gateAiQuota";

/** START：先检查 AI 额度，再进入 planTurnQueue */
export function selectAtGraphStart(
  _state: AgentStateType,
): AtGraphStartTarget {
  return "gateAiQuota";
}

export const paths: AtGraphStartTarget[] = ["gateAiQuota"];
