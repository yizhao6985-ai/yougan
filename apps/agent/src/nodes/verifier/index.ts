import { isEmptyThread } from "#agent/lib/empty/index.js";
import type { AgentStateType } from "#agent/state.js";
import { generateSuggestedConversationTitle } from "./conversation-title/generate.js";
import { generateOpeningTopicSuggestions } from "./suggestions/opening/suggestions.js";
import { generateTurnSuggestions } from "./suggestions/turn/index.js";

/** 验收：生成 nextStepSuggestions（开屏 7 条 / 对话流 4 条）与建议对话标题 */
export async function verifyTurnNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  if (state.turnCancelled) {
    return { nextStepSuggestions: null, suggestedConversationTitle: null };
  }

  if (isEmptyThread(state)) {
    const nextStepSuggestions = await generateOpeningTopicSuggestions(state);
    return { nextStepSuggestions };
  }

  const [nextStepSuggestions, suggestedConversationTitle] = await Promise.all([
    generateTurnSuggestions(state),
    generateSuggestedConversationTitle(state),
  ]);

  return {
    nextStepSuggestions,
    suggestedConversationTitle,
  };
}
