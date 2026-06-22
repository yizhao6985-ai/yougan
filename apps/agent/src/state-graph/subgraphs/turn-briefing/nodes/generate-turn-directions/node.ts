/** 结构化生成延伸方向，写入 state.turnDirections */
import { HumanMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import {
  DEFAULT_TURN_DIRECTIONS_HINT,
  OPENING_TURN_DIRECTIONS_COUNT,
  TURN_END_DIRECTIONS_COUNT,
  buildProfileSetupSuggestionFocus,
  buildProfileSetupSuggestionHint,
  computeSuggestionLayerCounts,
  hasSuggestionLayeredContext,
  previewHasContent,
  resolveProfileSetupDirectionRoles,
  type TurnDirections,
} from "@yougan/domain";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import { LLM_TIMEOUT_MS } from "#agent/llm/invoke/timeout.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import { getLatestHumanMessageText } from "#agent/messages/human.js";
import { getPreview, getProfile } from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { newTurnDirection } from "./helpers/direction-factory.js";
import { buildFallbackTurnDirections } from "./helpers/build-fallback-turn-directions.js";
import { buildTurnDirectionsPrompt } from "./prompt.js";
import { turnDirectionsResponseSchema } from "./schema.js";

const OPENING_HINT = "";

async function invokeTurnDirections(
  state: AgentStateType,
  options: {
    count: number;
    isOpening: boolean;
    lastUserMessage?: string;
    temperature: number;
  },
  config?: RunnableConfig,
): Promise<TurnDirections | null> {
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

  const prompt = buildTurnDirectionsPrompt(state, {
    count: options.count,
    isOpening: options.isOpening,
    lastUserMessage: options.lastUserMessage,
  });

  try {
    const parsed = await invokeStructured(
      createChatModel({ temperature: options.temperature }),
      turnDirectionsResponseSchema(options.count),
      [new HumanMessage(prompt)],
      {
        name: "turn_directions",
        timeoutMs: LLM_TIMEOUT_MS.suggestions,
        maxAttempts: 1,
      },
      config,
    );

    const directions = resolveProfileSetupDirectionRoles(
      parsed.directions.map((item) =>
        newTurnDirection({
          label: item.label,
          prompt: item.prompt,
          outcome: item.outcome,
        }),
      ),
      {
        profile,
        beforeProfile: state.profile,
        hasPreview,
      },
    );
    if (directions.length === 0) return null;

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
        (options.isOpening ? OPENING_HINT : DEFAULT_TURN_DIRECTIONS_HINT),
      directions,
    };
  } catch {
    return null;
  }
}

async function resolveTurnDirections(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<TurnDirections | null> {
  const isOpening = (state.messages ?? []).length === 0;

  if (isOpening) {
    return invokeTurnDirections(
      state,
      {
        count: OPENING_TURN_DIRECTIONS_COUNT,
        isOpening: true,
        temperature: 0.4,
      },
      config,
    );
  }

  const lastUserMessage = getLatestHumanMessageText(state.messages).trim();
  return invokeTurnDirections(
    state,
    {
      count: TURN_END_DIRECTIONS_COUNT,
      isOpening: false,
      lastUserMessage: lastUserMessage || undefined,
      temperature: 0.6,
    },
    config,
  );
}

export async function generateTurnDirectionsNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  if (state.turn.cancelled) {
    return {};
  }

  const turnDirections =
    (await resolveTurnDirections(state, config)) ??
    buildFallbackTurnDirections(state);

  if (!turnDirections) {
    return patchAiUsageMetering(state.aiUsage, config);
  }

  return {
    turnDirections,
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}
