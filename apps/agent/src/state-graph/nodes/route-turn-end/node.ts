import type { AgentStateType } from "#agent/state.js";

/** 回合末 fan-out 锚点：无 state 变更，并行调度 generateSuggestions 与 generateTitle */
export function routeTurnEndNode(
  _state: AgentStateType,
): Partial<AgentStateType> {
  return {};
}
