import { END } from "@langchain/langgraph";

import {
  parseCompletedTurnKinds,
  parseTurnQueue,
} from "#agent/lib/parse-agent-state.js";
import type { AgentStateType } from "#agent/state.js";

export const from = "advanceTurnQueue" as const;

export type AfterTurnQueueTarget =
  | "dispatchTurnQueue"
  | "updateNextStepSuggestions"
  | typeof END;

function shouldOfferTurnNextStepSuggestions(state: AgentStateType): boolean {
  const completed = parseCompletedTurnKinds(state);
  return completed.some((kind) => ["inspiration", "outline"].includes(kind));
}

/** 队列非空继续下一项；否则按需生成回合末下一步建议或结束 */
export function routeAfterTurnQueue(
  state: AgentStateType,
): AfterTurnQueueTarget {
  if (parseTurnQueue(state).length > 0) {
    return "dispatchTurnQueue";
  }
  if (shouldOfferTurnNextStepSuggestions(state)) {
    return "updateNextStepSuggestions";
  }
  return END;
}

export const paths: AfterTurnQueueTarget[] = [
  "dispatchTurnQueue",
  "updateNextStepSuggestions",
  END,
];
