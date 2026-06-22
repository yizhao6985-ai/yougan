import { END } from "@langchain/langgraph";

import type { AgentStateType } from "#agent/state.js";

import { shouldComposeTurnBriefing } from "../nodes/compose-turn-briefing/helpers/build-briefing-fallback.js";

export const from = "generateTurnDirections" as const;

export type AfterGenerateTurnDirectionsTarget =
  | "composeTurnBriefing"
  | typeof END;

export function selectAfterGenerateTurnDirections(
  state: AgentStateType,
): AfterGenerateTurnDirectionsTarget {
  if (state.turn.cancelled) {
    return END;
  }

  const isOpening = (state.messages ?? []).length === 0;
  if (isOpening) {
    return END;
  }

  const hasDirections = (state.turnDirections?.directions.length ?? 0) > 0;
  if (!shouldComposeTurnBriefing(state) && !hasDirections) {
    return END;
  }

  return "composeTurnBriefing";
}

export const paths: AfterGenerateTurnDirectionsTarget[] = [
  "composeTurnBriefing",
  END,
];
