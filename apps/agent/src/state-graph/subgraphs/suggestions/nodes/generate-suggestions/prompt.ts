/** 下一步建议 prompt（开屏与回合末共用，仅条数与上下文不同） */
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
  input: NextStepSuggestionsPromptInput,
): string {
  const workContext = [
    buildWorkTitleSection(state),
    [
      buildWorkStateSection(state),
      buildRecentMessagesBlock(input),
      buildGenerationRequirements(input),
    ].join(""),
  ].join("\n\n");

  return [
    `你是「有感 Yougan」创作搭子。${buildSceneIntro(input)}`,
    workContext,
    buildConstraintsSection(input),
  ].join("\n\n");
}
