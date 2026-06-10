/** advanceTurnQueue：队列未耗尽继续 dispatch，否则进入验收或提交 */
import { END } from "@langchain/langgraph";

import { getTurnQueue } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import {
  type CommitOrEndTarget,
  commitTurnOrEnd,
} from "./commit-or-end.js";

export const from = "advanceTurnQueue" as const;

export type TurnQueueDrainTarget =
  | "dispatchTurnQueue"
  | "generateSuggestions"
  | "routeTurnEnd"
  | CommitOrEndTarget;

export function drainTurnQueueOrVerify(
  state: AgentStateType,
): TurnQueueDrainTarget {
  if (getTurnQueue(state).length > 0) {
    return "dispatchTurnQueue";
  }
  if (state.turnCancelled) {
    return commitTurnOrEnd(state);
  }
  if ((state.messages ?? []).length === 0) {
    return "generateSuggestions";
  }
  return "routeTurnEnd";
}

export const paths: TurnQueueDrainTarget[] = [
  "dispatchTurnQueue",
  "generateSuggestions",
  "routeTurnEnd",
  "commitTurn",
  END,
];
