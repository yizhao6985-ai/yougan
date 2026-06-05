/** advanceTurnQueue 之后：队列未空则继续 dispatch，否则进入 verifyTurn */
import { parseTurnQueue } from "#agent/lib/parse-agent-state.js";
import type { AgentStateType } from "#agent/state.js";

export const from = "advanceTurnQueue" as const;

export type AfterTurnQueueTarget = "dispatchTurnQueue" | "verifyTurn";

/** 队列非空继续调度；否则进入验收生成下一步建议 */
export function routeAfterTurnQueue(
  state: AgentStateType,
): AfterTurnQueueTarget {
  if (parseTurnQueue(state).length > 0) {
    return "dispatchTurnQueue";
  }
  return "verifyTurn";
}

export const paths: AfterTurnQueueTarget[] = [
  "dispatchTurnQueue",
  "verifyTurn",
];
