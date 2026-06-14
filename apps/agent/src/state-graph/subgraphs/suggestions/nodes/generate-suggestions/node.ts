/** suggestions 子图：生成 nextStepSuggestions（开屏 7 条 / 回合末 4 条） */
import { HumanMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import {
  DEFAULT_NEXT_STEP_SUGGESTIONS_HINT,
  type NextStepSuggestions,
} from "@yougan/domain";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { extractLastMessages } from "./helpers/extract-last-messages.js";
import { hasSuggestionWorkContext } from "./helpers/has-suggestion-work-context.js";
import { newNextStepSuggestion } from "./helpers/suggestion-factory.js";
import { buildNextStepSuggestionsPrompt } from "./prompt.js";
import {
  nextStepSuggestionsResponseSchema,
  OPENING_NEXT_STEP_SUGGESTIONS_COUNT,
  TURN_NEXT_STEP_SUGGESTIONS_COUNT,
} from "./schema.js";

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
  config?: RunnableConfig,
): Promise<NextStepSuggestions | null> {
  const topicMode = options.isOpening && !hasSuggestionWorkContext(state);
  const llm = createChatModel({ temperature: options.temperature });
  const prompt = buildNextStepSuggestionsPrompt(state, {
    count: options.count,
    isOpening: options.isOpening,
    topicMode,
    lastUserMessage: options.lastUserMessage,
    lastAssistantReply: options.lastAssistantReply,
  });

  try {
    const parsed = await invokeStructured(
      llm,
      nextStepSuggestionsResponseSchema(options.count),
      [new HumanMessage(prompt)],
      { name: "next_step_suggestions" },
      config,
    );
    const suggestions = parsed.suggestions.map((s) =>
      newNextStepSuggestion(s.kind, s.label, s.message),
    );
    if (suggestions.length === 0) return null;

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

async function resolveNextStepSuggestions(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<NextStepSuggestions | null> {
  const isOpening = (state.messages ?? []).length === 0;

  if (isOpening) {
    return invokeNextStepSuggestions(
      state,
      {
        count: OPENING_NEXT_STEP_SUGGESTIONS_COUNT,
        isOpening: true,
        temperature: 0.55,
      },
      config,
    );
  }

  const { lastAssistant, lastUser } = extractLastMessages(state);
  return invokeNextStepSuggestions(
    state,
    {
      count: TURN_NEXT_STEP_SUGGESTIONS_COUNT,
      isOpening: false,
      lastUserMessage: lastUser,
      lastAssistantReply: lastAssistant,
      temperature: 0.6,
    },
    config,
  );
}

export async function generateSuggestionsNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  if (state.turn.cancelled) {
    return {};
  }

  const nextStepSuggestions = await resolveNextStepSuggestions(state, config);
  return { nextStepSuggestions };
}
