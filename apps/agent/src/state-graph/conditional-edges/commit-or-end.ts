import { END } from "@langchain/langgraph";

import type { AgentStateType } from "#agent/state.js";

export type CommitOrEndTarget = typeof END | "commitTurn";

/** 验收节点出口：开屏建议直接结束；有消息的回合提交 state 顶层 */
export function commitTurnOrEnd(state: AgentStateType): CommitOrEndTarget {
  if ((state.messages ?? []).length === 0) {
    return END;
  }
  return "commitTurn";
}

export const paths: CommitOrEndTarget[] = [END, "commitTurn"];
