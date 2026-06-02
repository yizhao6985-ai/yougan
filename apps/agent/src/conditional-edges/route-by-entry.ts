import type { AgentStateType } from "../state.js";

export type EntryRoute = "updateBriefSuggestions" | "resolveTurnQueue";

/** 当前 thread 是否尚无对话内容（无 messages） */
export function isEmptyThread(state: AgentStateType): boolean {
  return (state.messages ?? []).length === 0;
}

/** 主图入口：空 thread → 开场建议；否则解析任务队列 */
export function routeByEntry(state: AgentStateType): EntryRoute {
  if (isEmptyThread(state)) {
    return "updateBriefSuggestions";
  }
  return "resolveTurnQueue";
}

export const paths = {
  updateBriefSuggestions: "updateBriefSuggestions",
  resolveTurnQueue: "resolveTurnQueue",
} as const;
