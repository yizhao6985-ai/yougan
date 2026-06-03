import type { AgentStateType } from "../../state.js";

/** 当前 thread 是否尚无对话内容（无 messages） */
export function isEmptyThread(state: AgentStateType): boolean {
  return (state.messages ?? []).length === 0;
}
