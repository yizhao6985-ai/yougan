import { isEmptyThread } from "#agent/lib/empty/index.js";
import type { AgentStateType } from "#agent/state.js";

export type EntryRoute = "verifyTurn" | "orchestrateTurn";

/** 主图入口：空 thread → 开屏建议；否则编排本轮队列 */
export function routeByEntry(state: AgentStateType): EntryRoute {
  if (isEmptyThread(state)) {
    return "verifyTurn";
  }
  return "orchestrateTurn";
}

export const paths = {
  verifyTurn: "verifyTurn",
  orchestrateTurn: "orchestrateTurn",
} as const;
