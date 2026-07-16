/** advanceTurnQueue 之后：队列未完则继续 dispatch，否则与并行建议在 commitTurn 汇合 */
import { getTurnQueue } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export const from = "advanceTurnQueue" as const;

export type AfterAdvanceTurnQueueTarget =
  | "dispatchTurnQueue"
  | "commitTurn";

export function selectAfterAdvanceTurnQueue(
  state: AgentStateType,
): AfterAdvanceTurnQueueTarget {
  if (getTurnQueue(state).length > 0) {
    return "dispatchTurnQueue";
  }
  return "commitTurn";
}

export const paths: AfterAdvanceTurnQueueTarget[] = [
  "dispatchTurnQueue",
  "commitTurn",
];
