import type { AgentStateType } from "#agent/state.js";
import { generateSuggestedConversationTitle } from "./conversation-title/suggest-title-node.js";
import { generateNextStepSuggestions } from "./suggestions/generate.js";

/** 验收：生成 nextStepSuggestions（开屏 7 条 / 回合末 4 条）与建议对话标题 */
export async function verifyTurnNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  if (state.turnCancelled) {
    return { nextStepSuggestions: null, suggestedConversationTitle: null };
  }

  const isOpening = (state.messages ?? []).length === 0;
  const nextStepSuggestions = await generateNextStepSuggestions(state);

  if (isOpening) {
    return { nextStepSuggestions };
  }

  const suggestedConversationTitle =
    await generateSuggestedConversationTitle(state);

  return {
    nextStepSuggestions,
    suggestedConversationTitle,
  };
}
