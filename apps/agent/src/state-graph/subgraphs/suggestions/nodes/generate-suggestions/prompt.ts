/** 下一步建议 prompt（开屏与回合末共用：同一套规则，仅条数与对话上下文不同） */
import {
  buildProfileSetupSuggestionFocus,
  buildSuggestionSlotRecipe,
  computeSuggestionLayerCounts,
  hasSuggestionLayeredContext,
  previewHasContent,
} from "@yougan/domain";

import { getPreview, getProfile } from "#agent/state-io/index.js";
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
  input: Omit<NextStepSuggestionsPromptInput, "layered">,
): string {
  const profile = getProfile(state);
  const hasPreview = previewHasContent(getPreview(state));
  const layered = hasSuggestionLayeredContext(profile, { hasPreview });
  const profileSetupFocus = buildProfileSetupSuggestionFocus({
    before: state.profile,
    after: profile,
    hasPreview,
  });
  const layerCounts = computeSuggestionLayerCounts(
    input.count,
    profileSetupFocus,
    layered,
  );
  const slotRecipe = buildSuggestionSlotRecipe(
    profileSetupFocus,
    input.count,
    profile,
    { hasPreview },
  );

  const promptInput: NextStepSuggestionsPromptInput = {
    ...input,
    layered,
  };

  const workContext = [
    buildWorkTitleSection(state),
    [
      buildWorkStateSection(state, { profileSetupFocus }),
      buildRecentMessagesBlock(promptInput),
      buildGenerationRequirements(input.count, {
        layered,
        layerCounts,
        slotRecipe,
      }),
    ].join(""),
  ].join("\n\n");

  return [
    `你是「有感 Yougan」创作搭子。${buildSceneIntro(promptInput)}`,
    workContext,
    buildConstraintsSection(promptInput),
  ].join("\n\n");
}
