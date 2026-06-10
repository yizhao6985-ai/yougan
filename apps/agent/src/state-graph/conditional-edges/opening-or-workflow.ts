import { END } from "@langchain/langgraph";

import type { AgentStateType } from "#agent/state.js";

export type OpeningOrWorkflowTarget =
  | "workflowTurn"
  | "generateSuggestions"
  | typeof END;

/** START：空 thread 生成开屏建议；已取消则直接结束 */
export function selectOpeningOrWorkflow(
  state: AgentStateType,
): OpeningOrWorkflowTarget {
  if ((state.messages ?? []).length > 0) {
    return "workflowTurn";
  }
  if (state.turnCancelled) {
    return END;
  }
  return "generateSuggestions";
}

export const paths: OpeningOrWorkflowTarget[] = [
  "workflowTurn",
  "generateSuggestions",
  END,
];
