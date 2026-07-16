import {
  CONTENT_FORMATS,
  buildProfileSetupSuggestionFocus,
  type ContentFormatId,
} from "@yougan/domain";

import { getProfile } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import { buildConstraintsSection } from "./helpers/prompt/constraints.js";
import { buildGenerationRequirements } from "./helpers/prompt/generation-requirements.js";
import { buildRecentMessagesBlock } from "./helpers/prompt/recent-messages.js";
import { buildSceneIntro } from "./helpers/prompt/scene-intro.js";
import type { TurnDirectionsPromptInput } from "./helpers/prompt/types.js";
import { buildWorkStateSection } from "./helpers/prompt/work-state.js";
import { buildWorkTitleSection, isPlaceholderWorkTitle } from "./helpers/prompt/work-title.js";

const FORMAT_LABELS = Object.fromEntries(
  CONTENT_FORMATS.map((item) => [item.id, item.label]),
) as Record<ContentFormatId, string>;

export function buildTurnDirectionsPrompt(
  state: AgentStateType,
  input: TurnDirectionsPromptInput,
): string {
  const profile = getProfile(state);
  const profileSetupFocus = buildProfileSetupSuggestionFocus({
    before: state.profile,
    after: profile,
  });

  const titleAnchored = !isPlaceholderWorkTitle(state.workTitle);
  const format = profile.direction.format;

  const promptInput: TurnDirectionsPromptInput = {
    ...input,
    workTitle: state.workTitle,
  };

  const workContext = [
    buildWorkTitleSection(state),
    [
      buildWorkStateSection(state, { profileSetupFocus }),
      buildRecentMessagesBlock(promptInput),
      buildGenerationRequirements(input.count, { titleAnchored }),
    ].join(""),
  ].join("\n\n");

  return [
    `你是「有感 Yougan」创作搭子。${buildSceneIntro(promptInput)}`,
    workContext,
    buildConstraintsSection(promptInput, {
      workTitle: state.workTitle,
      format,
      formatLabel: format ? FORMAT_LABELS[format] : null,
    }),
  ].join("\n\n");
}
