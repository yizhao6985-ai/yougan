import type { AgentStateType } from "../../state.js";

export async function clearSuggestionsNode(
  _state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  return { inspirationSuggestions: null };
}
