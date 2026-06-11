import type { AgentStateType } from "#agent/state.js";

export type AtGraphStartTarget = "planTurnQueue" | "generateSuggestions";

/** START：空 thread 走开屏建议；有消息走对话流程 */
export function selectAtGraphStart(
  state: AgentStateType,
): AtGraphStartTarget {
  if ((state.messages ?? []).length > 0) {
    return "planTurnQueue";
  }
  return "generateSuggestions";
}

export const paths: AtGraphStartTarget[] = [
  "planTurnQueue",
  "generateSuggestions",
];
