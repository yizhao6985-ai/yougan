import type { AgentStateType } from "../state.js";

export function clearBriefSuggestionsNode(_state: AgentStateType) {
  return { briefSuggestions: null };
}
