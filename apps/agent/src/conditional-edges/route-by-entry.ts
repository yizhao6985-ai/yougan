import { parseMode } from "../lib/parse-agent-state.js";
import type { ChatMode } from "../schema.js";
import type { AgentStateType } from "../state.js";

export type EntryRoute = "recommendConversation" | "resolveTurnMode";

/** 当前 thread 是否尚无对话内容（无 messages） */
export function isEmptyThread(state: AgentStateType): boolean {
  return (state.messages ?? []).length === 0;
}

/** 主图入口：空 thread → 内容推荐；否则先解析本轮意图再路由 */
export function routeByEntry(state: AgentStateType): EntryRoute {
  if (isEmptyThread(state)) {
    return "recommendConversation";
  }
  return "resolveTurnMode";
}

export const paths = {
  recommendConversation: "recommendConversation",
  resolveTurnMode: "resolveTurnMode",
} as const;

/** @deprecated 路由前已由 resolveTurnMode 写入 state.mode */
export function routeByMode(state: AgentStateType): ChatMode {
  return parseMode(state);
}
