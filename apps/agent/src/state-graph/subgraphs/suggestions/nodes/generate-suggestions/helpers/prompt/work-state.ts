import {
  EMPTY_WORK_REFERENCES,
  buildProfileSetupSuggestionPromptBlock,
  buildProfileStepPromptSection,
  isProfileSetupPhase,
  type ProfileSetupSuggestionFocus,
} from "@yougan/domain";

import {
  profileSummary,
  profileReferencesSummary,
} from "#agent/prompts/profile-summary.js";
import { getProfile } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export function buildWorkStateSection(
  state: AgentStateType,
  options?: { profileSetupFocus?: ProfileSetupSuggestionFocus },
): string {
  const profile = getProfile(state);
  const references = state.references?.length
    ? state.references
    : [...EMPTY_WORK_REFERENCES];
  const preview = state.production?.preview;

  const previewLine = preview?.body?.trim()
    ? `已有预览正文（节选）：${preview.body.slice(0, 200)}…`
    : "尚无预览成稿";

  const profileBlock = isProfileSetupPhase(profile)
    ? [
        buildProfileStepPromptSection(profile),
        options?.profileSetupFocus
          ? buildProfileSetupSuggestionPromptBlock(
              options.profileSetupFocus,
              profile,
            )
          : "",
        "",
        "方案摘要（只读）：",
        profileSummary(profile, references),
      ]
        .filter(Boolean)
        .join("\n")
    : profileSummary(profile, references);

  return `## 作品状态
${profileBlock}
${profileReferencesSummary(references)}
${previewLine}`;
}
