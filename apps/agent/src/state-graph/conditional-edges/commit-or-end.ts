import { END } from "@langchain/langgraph";

import { isEmptyThread } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export const from = "verifyTurn" as const;

export type CommitOrEndTarget = typeof END | "commitTurn";

/** verifyTurn：开屏建议后结束；有消息的回合提交 canonical */
export function commitTurnOrEnd(state: AgentStateType): CommitOrEndTarget {
  if (isEmptyThread(state)) {
    return END;
  }
  return "commitTurn";
}

export const paths: CommitOrEndTarget[] = [END, "commitTurn"];
