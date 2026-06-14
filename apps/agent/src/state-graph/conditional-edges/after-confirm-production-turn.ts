/** confirmProductionTurn 之后：确认进入 productionGraph；取消则 advanceTurnQueue 出队并继续后续队列项 */
import { getTurn } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export const from = "confirmProductionTurn" as const;

export type AfterConfirmProductionTurnTarget =
  | "productionGraph"
  | "advanceTurnQueue";

export function selectAfterConfirmProductionTurn(
  state: AgentStateType,
): AfterConfirmProductionTurnTarget {
  if (getTurn(state).productionConfirm === "decline") {
    return "advanceTurnQueue";
  }
  return "productionGraph";
}

export const paths: AfterConfirmProductionTurnTarget[] = [
  "productionGraph",
  "advanceTurnQueue",
];
