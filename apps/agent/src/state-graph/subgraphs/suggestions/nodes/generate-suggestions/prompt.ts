/** 下一步建议 prompt（开屏与回合末共用，仅条数与上下文不同） */
import {
  buildProfileSetupSuggestionFocus,
  isProfileSetupPhase,
} from "@yougan/domain";

import { getProfile } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import { buildConstraintsSection } from "./helpers/prompt/constraints.js";
import { buildGenerationRequirements } from "./helpers/prompt/generation-requirements.js";
import { buildRecentMessagesBlock } from "./helpers/prompt/recent-messages.js";
import { buildSceneIntro } from "./helpers/prompt/scene-intro.js";
import type { NextStepSuggestionsPromptInput } from "./helpers/prompt/types.js";
import { buildWorkStateSection } from "./helpers/prompt/work-state.js";
import { buildWorkTitleSection } from "./helpers/prompt/work-title.js";

export type { NextStepSuggestionsPromptInput } from "./helpers/prompt/types.js";

export function buildNextStepSuggestionsPrompt(
  state: AgentStateType,
  input: Omit<
    NextStepSuggestionsPromptInput,
    "profileSetupMode" | "profileSetupFocus"
  >,
): string {
  const profile = getProfile(state);
  const profileSetupMode =
    !input.topicMode && isProfileSetupPhase(profile);
  const profileSetupFocus = profileSetupMode
    ? buildProfileSetupSuggestionFocus({
        before: state.profile,
        after: profile,
      })
    : undefined;

  const promptInput: NextStepSuggestionsPromptInput = {
    ...input,
    profileSetupMode,
    profileSetupFocus,
  };

  const workContext = [
    buildWorkTitleSection(state),
    [
      buildWorkStateSection(state, { profileSetupFocus }),
      buildRecentMessagesBlock(promptInput),
      buildGenerationRequirements(promptInput, profile),
    ].join(""),
  ].join("\n\n");

  return [
    `你是「有感 Yougan」创作搭子。${buildSceneIntro(promptInput)}`,
    workContext,
    buildConstraintsSection(promptInput),
  ].join("\n\n");
}
