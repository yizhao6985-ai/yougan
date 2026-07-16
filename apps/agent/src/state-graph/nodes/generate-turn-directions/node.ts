/** 与主回合并行生成延伸方向，写入 state.pendingTurnDirections；commitTurn 再提升 */
import { HumanMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import {
  DEFAULT_TURN_DIRECTIONS_HINT,
  OPENING_TURN_DIRECTIONS_COUNT,
  TURN_END_DIRECTIONS_COUNT,
  buildProfileSetupSuggestionFocus,
  buildProfileSetupSuggestionHint,
  type TurnDirections,
} from "@yougan/domain";

import type { NodeError } from "@langchain/langgraph";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import { getLatestHumanMessageText } from "#agent/messages/human.js";
import { getProfile } from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { rethrowUnlessRecoverable } from "../../helpers/recoverable-node-error.js";
import { newTurnDirection } from "./helpers/direction-factory.js";
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
  const profileSetupFocus = buildProfileSetupSuggestionFocus({
    before: state.profile,
    after: profile,
  });

  const prompt = buildTurnDirectionsPrompt(state, {
    count: options.count,
    isOpening: options.isOpening,
    lastUserMessage: options.lastUserMessage,
  });

  const parsed = await invokeStructured(
    createChatModel({ temperature: options.temperature }),
    turnDirectionsResponseSchema(options.count),
    [new HumanMessage(prompt)],
    { name: "turn_directions" },
    config,
  );

  const directions = parsed.directions.map((item) =>
    newTurnDirection({
      label: item.label,
      prompt: item.prompt,
      outcome: item.outcome,
    }),
  );
  if (directions.length === 0) return null;

  return {
    hint:
      parsed.hint?.trim() ||
      buildProfileSetupSuggestionHint(profileSetupFocus, profile) ||
      (options.isOpening ? OPENING_HINT : DEFAULT_TURN_DIRECTIONS_HINT),
    directions,
  };
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

function pendingTurnDirectionsPatch(
  pendingTurnDirections: TurnDirections | null,
): AgentStatePatch {
  return { pendingTurnDirections };
}

export async function generateTurnDirectionsNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  if (state.turn.cancelled) {
    return pendingTurnDirectionsPatch(null);
  }

  const turnDirections = await resolveTurnDirections(state, config);
  if (state.turn.cancelled) {
    return pendingTurnDirectionsPatch(null);
  }
  return pendingTurnDirectionsPatch(turnDirections);
}

export function generateTurnDirectionsErrorHandler(
  state: AgentStateType,
  error: NodeError,
): AgentStatePatch {
  rethrowUnlessRecoverable(error);
  return pendingTurnDirectionsPatch(null);
}
