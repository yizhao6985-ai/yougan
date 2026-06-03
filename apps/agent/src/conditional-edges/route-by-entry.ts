import { isEmptyThread } from "../lib/empty/index.js";
import type { AgentStateType } from "../state.js";

export type EntryRoute = "updateNextStepSuggestions" | "resolveTurnQueue";

/** 主图入口：空 thread → 开屏选题建议；否则解析任务队列 */
export function routeByEntry(state: AgentStateType): EntryRoute {
  if (isEmptyThread(state)) {
    return "updateNextStepSuggestions";
  }
  return "resolveTurnQueue";
}

export const paths = {
  updateNextStepSuggestions: "updateNextStepSuggestions",
  resolveTurnQueue: "resolveTurnQueue",
} as const;
