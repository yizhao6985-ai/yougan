import { END } from "@langchain/langgraph";

import { isEmptyThread } from "#agent/lib/empty/index.js";
import type { AgentStateType } from "#agent/state.js";

export const from = "verifyTurn" as const;

export type AfterVerifyTarget = typeof END | "commitTurn";

/** 开屏建议后直接结束；有消息的回合进入 commit */
export function routeAfterVerify(state: AgentStateType): AfterVerifyTarget {
  if (isEmptyThread(state)) {
    return END;
  }
  return "commitTurn";
}

export const paths: AfterVerifyTarget[] = [END, "commitTurn"];
