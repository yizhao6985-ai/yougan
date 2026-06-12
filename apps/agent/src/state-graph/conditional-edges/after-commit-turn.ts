/** commitTurn 之后：需系统收尾则 postCommit，否则进入 summarizeMessages */
import type { AgentStateType } from "#agent/state.js";

import { needsPostCommitProcessing } from "../nodes/post-commit/helpers/needs-post-commit.js";

export const from = "commitTurn" as const;

export type AfterCommitTurnTarget = "postCommit" | "summarizeMessages";

export function selectAfterCommitTurn(
  state: AgentStateType,
): AfterCommitTurnTarget {
  return needsPostCommitProcessing(state) ? "postCommit" : "summarizeMessages";
}

export const paths = {
  postCommit: "postCommit",
  summarizeMessages: "summarizeMessages",
} as const;
