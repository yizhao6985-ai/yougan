/** confirmReviseTurn 之后：确认进入 reviseGraph；取消则 advanceTurnQueue */
import { getTurn } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export const from = "confirmReviseTurn" as const;

export type AfterConfirmReviseTurnTarget =
  | "reviseGraph"
  | "advanceTurnQueue";

export function selectAfterConfirmReviseTurn(
  state: AgentStateType,
): AfterConfirmReviseTurnTarget {
  if (getTurn(state).reviseConfirm === "decline") {
    return "advanceTurnQueue";
  }
  return "reviseGraph";
}

export const paths: AfterConfirmReviseTurnTarget[] = [
  "reviseGraph",
  "advanceTurnQueue",
];
