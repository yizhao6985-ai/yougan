import { EMPTY_TURN_RUNTIME, type TurnRuntime } from "@yougan/domain";

import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

export function getTurn(state: AgentStateType): TurnRuntime {
  return state.turn ?? EMPTY_TURN_RUNTIME;
}

/** 仅返回 turn 增量；由 LangGraph reducer / 前端 updates 合并，避免并行节点互相覆盖 */
export function patchTurn(
  _state: AgentStateType,
  patch: Partial<TurnRuntime>,
): Pick<AgentStatePatch, "turn"> {
  return { turn: patch };
}
