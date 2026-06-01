import { generateBriefSuggestions } from "./generate-suggestions.logic.js";
import type { AgentStateType } from "../../../state.js";

export async function generateSuggestionsNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const briefSuggestions = await generateBriefSuggestions(state);
  return { briefSuggestions };
}
