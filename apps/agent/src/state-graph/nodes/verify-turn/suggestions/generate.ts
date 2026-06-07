/** 下一步建议：开屏与回合末共用，仅条数不同 */
import { HumanMessage } from "@langchain/core/messages";

import {
  DEFAULT_NEXT_STEP_SUGGESTIONS_HINT,
  newNextStepSuggestion,
  type NextStepSuggestions,
} from "@yougan/domain";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import type { AgentStateType } from "#agent/state.js";
import { extractLastMessages } from "./extract-last-messages.js";
import { buildNextStepSuggestionsPrompt } from "./prompt.js";
import {
  nextStepSuggestionsResponseSchema,
  OPENING_NEXT_STEP_SUGGESTIONS_COUNT,
  TURN_NEXT_STEP_SUGGESTIONS_COUNT,
} from "./schema.js";
import { hasSuggestionWorkContext } from "./work-context.js";

const OPENING_HINT = "";

async function invokeNextStepSuggestions(
  state: AgentStateType,
  options: {
    count: number;
    isOpening: boolean;
    lastUserMessage?: string;
    lastAssistantReply?: string;
    temperature: number;
  },
): Promise<NextStepSuggestions | null> {
  const llm = createChatModel({ temperature: options.temperature });
  const prompt = buildNextStepSuggestionsPrompt(state, {
    count: options.count,
    isOpening: options.isOpening,
    lastUserMessage: options.lastUserMessage,
    lastAssistantReply: options.lastAssistantReply,
  });

  try {
    const parsed = await invokeStructured(
      llm,
      nextStepSuggestionsResponseSchema(options.count),
      [new HumanMessage(prompt)],
      { name: "next_step_suggestions" },
    );
    const suggestions = parsed.suggestions.map((s) =>
      newNextStepSuggestion(s.kind, s.label, s.message),
    );
    if (suggestions.length === 0) return null;

    const topicMode = options.isOpening && !hasSuggestionWorkContext(state);
    return {
      hint:
        parsed.hint?.trim() ||
        (topicMode ? OPENING_HINT : DEFAULT_NEXT_STEP_SUGGESTIONS_HINT),
      suggestions,
    };
  } catch {
    return null;
  }
}

export async function generateNextStepSuggestions(
  state: AgentStateType,
): Promise<NextStepSuggestions | null> {
  const isOpening = (state.messages ?? []).length === 0;

  if (isOpening) {
    return invokeNextStepSuggestions(state, {
      count: OPENING_NEXT_STEP_SUGGESTIONS_COUNT,
      isOpening: true,
      temperature: 0.55,
    });
  }

  const { lastAssistant, lastUser } = extractLastMessages(state);
  if (!lastAssistant.trim()) {
    return null;
  }

  return invokeNextStepSuggestions(state, {
    count: TURN_NEXT_STEP_SUGGESTIONS_COUNT,
    isOpening: false,
    lastUserMessage: lastUser,
    lastAssistantReply: lastAssistant,
    temperature: 0.6,
  });
}
