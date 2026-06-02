import type { AgentStateType } from "../../../state.js";

export async function prepareOutlineTurnNode(
  _state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  return { briefSuggestions: null };
}
