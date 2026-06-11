/** commitTurn 之后：需系统收尾则 postCommit，否则直达 END */
import { END } from "@langchain/langgraph";

import type { AgentStateType } from "#agent/state.js";

import { needsPostCommitProcessing } from "../nodes/post-commit/helpers/needs-post-commit.js";

export const from = "commitTurn" as const;

export type AfterCommitTurnTarget = "postCommit" | typeof END;

export function selectAfterCommitTurn(
  state: AgentStateType,
): AfterCommitTurnTarget {
  return needsPostCommitProcessing(state) ? "postCommit" : END;
}

export const paths = {
  postCommit: "postCommit",
  __end__: END,
} as const;
