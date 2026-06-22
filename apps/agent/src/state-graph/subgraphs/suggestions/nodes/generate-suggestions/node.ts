/** suggestions 子图：生成 nextStepSuggestions（开屏 9 条 / 回合末 4 条） */
import { HumanMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import {
  buildProfileSetupSuggestionFocus,
  buildProfileSetupSuggestionHint,
  computeSuggestionLayerCounts,
  hasSuggestionLayeredContext,
  OPENING_NEXT_STEP_SUGGESTIONS_COUNT,
  resolveProfileSetupSuggestionRoles,
  TURN_NEXT_STEP_SUGGESTIONS_COUNT,
  DEFAULT_NEXT_STEP_SUGGESTIONS_HINT,
  previewHasContent,
  type NextStepSuggestions,
} from "@yougan/domain";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import { LLM_TIMEOUT_MS } from "#agent/llm/invoke/timeout.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import { getPreview, getProfile } from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { extractLastMessages } from "./helpers/extract-last-messages.js";
import { newNextStepSuggestion } from "./helpers/suggestion-factory.js";
import { buildNextStepSuggestionsPrompt } from "./prompt.js";
import { nextStepSuggestionsResponseSchema } from "./schema.js";

const OPENING_HINT = "";

export {
  OPENING_NEXT_STEP_SUGGESTIONS_COUNT,
  TURN_NEXT_STEP_SUGGESTIONS_COUNT,
} from "@yougan/domain";

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
  const profile = getProfile(state);
  const hasPreview = previewHasContent(getPreview(state));
  const layered = hasSuggestionLayeredContext(profile, { hasPreview });
  const profileSetupFocus = buildProfileSetupSuggestionFocus({
    before: state.profile,
    after: profile,
    hasPreview,
  });
  const layerCounts = computeSuggestionLayerCounts(
    options.count,
    profileSetupFocus,
    layered,
  );

  const prompt = buildNextStepSuggestionsPrompt(state, {
    count: options.count,
    isOpening: options.isOpening,
    lastUserMessage: options.lastUserMessage,
    lastAssistantReply: options.lastAssistantReply,
  });

  try {
    const parsed = await invokeStructured(
      createChatModel({ temperature: options.temperature }),
      nextStepSuggestionsResponseSchema(options.count),
      [new HumanMessage(prompt)],
      {
        name: "next_step_suggestions",
        timeoutMs: LLM_TIMEOUT_MS.suggestions,
        maxAttempts: 1,
      },
      config,
    );
    const suggestions = resolveProfileSetupSuggestionRoles(
      parsed.suggestions.map((s) => newNextStepSuggestion(s.message)),
      {
        profile,
        beforeProfile: state.profile,
        hasPreview,
      },
    );
    if (suggestions.length === 0) return null;

    const layeredHint = buildProfileSetupSuggestionHint(
      profileSetupFocus,
      profile,
      layerCounts,
      layered,
    );

    return {
      hint:
        parsed.hint?.trim() ||
        layeredHint ||
        (options.isOpening ? OPENING_HINT : DEFAULT_NEXT_STEP_SUGGESTIONS_HINT),
      suggestions,
    };
  } catch {
    // 超时 / 解析失败：静默跳过，不阻断主流程
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
  return {
    nextStepSuggestions,
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}
