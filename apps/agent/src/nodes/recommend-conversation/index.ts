import { generateConversationRecommendations } from "./logic.js";
import type { AgentStateType } from "../../state.js";

export async function recommendConversationNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const briefSuggestions = await generateConversationRecommendations(state);
  return { briefSuggestions };
}
