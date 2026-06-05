/** advanceTurnQueue：队列未耗尽继续 dispatch，否则验收 */
import { parseTurnQueue } from "#agent/runtime/state-readers.js";
import type { AgentStateType } from "#agent/state.js";

export const from = "advanceTurnQueue" as const;

export type TurnQueueDrainTarget = "dispatchTurnQueue" | "verifyTurn";

export function drainTurnQueueOrVerify(
  state: AgentStateType,
): TurnQueueDrainTarget {
  if (parseTurnQueue(state).length > 0) {
    return "dispatchTurnQueue";
  }
  return "verifyTurn";
}

export const paths: TurnQueueDrainTarget[] = [
  "dispatchTurnQueue",
  "verifyTurn",
];
