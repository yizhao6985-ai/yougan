import type { AgentStateType } from "#agent/state.js";

export type OpeningOrWorkflowTarget = "workflowTurn" | "generateSuggestions";

/** START：空 thread 走开屏建议；有消息走对话流程 */
export function selectOpeningOrWorkflow(
  state: AgentStateType,
): OpeningOrWorkflowTarget {
  if ((state.messages ?? []).length > 0) {
    return "workflowTurn";
  }
  return "generateSuggestions";
}

export const paths: OpeningOrWorkflowTarget[] = [
  "workflowTurn",
  "generateSuggestions",
];
