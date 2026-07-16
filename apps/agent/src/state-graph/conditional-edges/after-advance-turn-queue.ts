/** advanceTurnQueue 之后：队列未完则继续 dispatch，否则生成延伸方向 */
import { getTurnQueue } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export const from = "advanceTurnQueue" as const;

export type AfterAdvanceTurnQueueTarget =
  | "dispatchTurnQueue"
  | "generateTurnDirections";

export function selectAfterAdvanceTurnQueue(
  state: AgentStateType,
): AfterAdvanceTurnQueueTarget {
  if (getTurnQueue(state).length > 0) {
    return "dispatchTurnQueue";
  }
  return "generateTurnDirections";
}

export const paths: AfterAdvanceTurnQueueTarget[] = [
  "dispatchTurnQueue",
  "generateTurnDirections",
];
