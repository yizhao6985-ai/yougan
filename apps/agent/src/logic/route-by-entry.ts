import { parseMode } from "../lib/parse-agent-state.js";
import type { ChatMode } from "../schema.js";
import type { AgentStateType } from "../state.js";

export type EntryRoute = ChatMode | "recommendConversation";

/** 当前 thread 是否尚无对话内容（无 messages） */
export function isEmptyThread(state: AgentStateType): boolean {
  return (state.messages ?? []).length === 0;
}

/** 主图入口：空 thread → 内容推荐；否则按 mode 路由 */
export function routeByEntry(state: AgentStateType): EntryRoute {
  if (isEmptyThread(state)) {
    return "recommendConversation";
  }
  return parseMode(state);
}

export const paths = {
  recommendConversation: "recommendConversation",
  inspiration: "inspirationGraph",
  creation: "creationGraph",
  ask: "askGraph",
} as const;
