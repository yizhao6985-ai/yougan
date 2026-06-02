import { END } from "@langchain/langgraph";

import {
  parseCompletedTurnTasks,
  parseTurnTaskQueue,
} from "../lib/parse-agent-state.js";
import type { AgentStateType } from "../state.js";

export const from = "advanceTurnQueue" as const;

export type AfterTurnTaskTarget =
  | "dispatchTurnTask"
  | "updateBriefSuggestions"
  | typeof END;

function shouldOfferBriefSuggestions(state: AgentStateType): boolean {
  const completed = parseCompletedTurnTasks(state);
  return completed.some((task) =>
    [
      "inspiration",
      "outline",
      "outline_patch",
      "brief",
      "ensure_outline",
    ].includes(task),
  );
}

/** 队列非空继续下一任务；否则按需生成快捷建议或结束。 */
export function routeAfterTurnTask(
  state: AgentStateType,
): AfterTurnTaskTarget {
  if (parseTurnTaskQueue(state).length > 0) {
    return "dispatchTurnTask";
  }
  if (shouldOfferBriefSuggestions(state)) {
    return "updateBriefSuggestions";
  }
  return END;
}

export const paths: AfterTurnTaskTarget[] = [
  "dispatchTurnTask",
  "updateBriefSuggestions",
  END,
];
