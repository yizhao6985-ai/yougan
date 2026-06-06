import type { AgentStateType } from "#agent/state.js";

export type OpeningOrOrchestrateTarget = "verifyTurn" | "orchestrateTurn";

/** START：空 thread 开屏建议，否则编排本轮 */
export function selectOpeningOrOrchestrate(
  state: AgentStateType,
): OpeningOrOrchestrateTarget {
  if ((state.messages ?? []).length === 0) {
    return "verifyTurn";
  }
  return "orchestrateTurn";
}

export const paths = {
  verifyTurn: "verifyTurn",
  orchestrateTurn: "orchestrateTurn",
} as const;
