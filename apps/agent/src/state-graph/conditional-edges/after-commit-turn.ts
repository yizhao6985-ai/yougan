/** commitTurn 之后：未取消则生成 nextStepSuggestions，否则直接进入 summarize */
import { getTurn } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export const from = "commitTurn" as const;

export type AfterCommitTurnTarget = "suggestionsGraph" | "summarizeMessages";

export function selectAfterCommitTurn(
  state: AgentStateType,
): AfterCommitTurnTarget {
  if (getTurn(state).cancelled) {
    return "summarizeMessages";
  }
  return "suggestionsGraph";
}

export const paths: AfterCommitTurnTarget[] = [
  "suggestionsGraph",
  "summarizeMessages",
];
