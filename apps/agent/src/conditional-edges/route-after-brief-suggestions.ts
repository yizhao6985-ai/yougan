import { END } from "@langchain/langgraph";

import type { AgentStateType } from "../state.js";

export const from = "updateBriefSuggestions" as const;

export type AfterBriefSuggestionsTarget = typeof END;

/** 开场/回合建议生成后直接结束 */
export function routeAfterBriefSuggestions(
  _state: AgentStateType,
): AfterBriefSuggestionsTarget {
  return END;
}

export const paths: AfterBriefSuggestionsTarget[] = [END];
