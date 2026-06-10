import type { AgentStateType } from "#agent/state.js";

/** commitTurn 后 fan-out 锚点：并行调度 generateSuggestions 与 generateTitle */
export function afterCommitNode(
  _state: AgentStateType,
): Partial<AgentStateType> {
  return {};
}
