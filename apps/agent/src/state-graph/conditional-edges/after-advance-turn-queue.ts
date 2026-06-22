/** advanceTurnQueue 之后：队列未完则继续 dispatch，否则进入回合简报 */
import { getTurnQueue } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export const from = "advanceTurnQueue" as const;

export type AfterAdvanceTurnQueueTarget = "dispatchTurnQueue" | "turnBriefingGraph";

export function selectAfterAdvanceTurnQueue(
  state: AgentStateType,
): AfterAdvanceTurnQueueTarget {
  if (getTurnQueue(state).length > 0) {
    return "dispatchTurnQueue";
  }
  return "turnBriefingGraph";
}

export const paths: AfterAdvanceTurnQueueTarget[] = [
  "dispatchTurnQueue",
  "turnBriefingGraph",
];
