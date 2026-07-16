import {
  DEFAULT_TURN_DIRECTIONS_HINT,
  TURN_END_DIRECTIONS_COUNT,
  buildProfileSetupProgressOptions,
  buildProfileSetupSuggestionFocus,
  buildProfileSetupSuggestionHint,
  getActiveProfileStep,
  getProfileSetupState,
  getProfileStepCopy,
  type TurnDirections,
} from "@yougan/domain";

import { getPreview, getProfile } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import { newTurnDirection } from "./direction-factory.js";

/** LLM 超时/失败时，用方案向导示例方向兜底，避免回合末无 chips */
export function buildFallbackTurnDirections(
  state: AgentStateType,
): TurnDirections | null {
  const profile = getProfile(state);
  const profileSetupOptions = buildProfileSetupProgressOptions({
    profile,
    preview: getPreview(state),
    production: state.production,
  });
  const activeStep = getActiveProfileStep(
    profile,
    profileSetupOptions.skippedSteps ?? [],
    profileSetupOptions,
  );
  const copy = getProfileStepCopy(profile, activeStep);
  const examples = copy.suggestionExamples
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, TURN_END_DIRECTIONS_COUNT);

  if (examples.length === 0) return null;

  const focus = buildProfileSetupSuggestionFocus({
    before: state.profile,
    after: profile,
    production: state.production,
  });

  const directions = examples.map((label) =>
    newTurnDirection({
      label,
      prompt: label,
      outcome: `继续完善${copy.title}`,
    }),
  );

  if (directions.length === 0) return null;

  const setup = getProfileSetupState(profile, profileSetupOptions);
  const activeMeta = setup.steps.find((step) => step.id === activeStep);

  return {
    hint:
      buildProfileSetupSuggestionHint(focus, profile) ||
      (activeMeta
        ? `第 ${activeMeta.index} 步 · ${activeMeta.title} — 点一条继续`
        : DEFAULT_TURN_DIRECTIONS_HINT),
    directions,
  };
}
