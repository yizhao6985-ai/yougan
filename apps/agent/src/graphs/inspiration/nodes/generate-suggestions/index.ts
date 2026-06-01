import { generateInspirationSuggestions } from "./logic.js";
import type { AgentStateType } from "../../../../state.js";

export async function generateInspirationSuggestionsNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const suggestions = await generateInspirationSuggestions(state);
  return { inspirationSuggestions: suggestions };
}
