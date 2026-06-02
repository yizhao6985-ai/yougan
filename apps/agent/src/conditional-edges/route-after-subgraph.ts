import { END } from "@langchain/langgraph";

import { parseMode } from "../lib/parse-agent-state.js";
import type { AgentStateType } from "../state.js";

export const from = [
  "inspirationGraph",
  "creationGraph",
  "askGraph",
] as const;

export type AfterSubgraphTarget = "updateBriefSuggestions" | typeof END;

/** 仅灵感本轮结束后生成建议；创作/提问不生成。 */
export function routeAfterSubgraph(
  state: AgentStateType,
): AfterSubgraphTarget {
  if (parseMode(state) === "inspiration") {
    return "updateBriefSuggestions";
  }
  return END;
}

export const paths: AfterSubgraphTarget[] = [
  "updateBriefSuggestions",
  END,
];
