import type { AgentStateType } from "../../../state.js";

export async function prepareInspirationTurnNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  return { briefSuggestions: null };
}
