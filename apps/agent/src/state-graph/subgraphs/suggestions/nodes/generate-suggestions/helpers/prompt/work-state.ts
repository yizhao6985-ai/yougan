import {
  EMPTY_WORK_REFERENCES,
  buildProfileSetupProgressOptions,
  buildProfileSetupSuggestionPromptBlock,
  buildProfileStepPromptSection,
  isProfileSetupPhase,
  previewPlainText,
  previewHasContent,
  type ProfileSetupSuggestionFocus,
} from "@yougan/domain";

import {
  profileSummary,
  profileReferencesSummary,
} from "#agent/prompts/profile-summary.js";
import { getPreview, getProduction, getProfile } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export function buildWorkStateSection(
  state: AgentStateType,
  options?: { profileSetupFocus?: ProfileSetupSuggestionFocus },
): string {
  const profile = getProfile(state);
  const references = state.references?.length
    ? state.references
    : [...EMPTY_WORK_REFERENCES];
  const preview = getPreview(state);
  const production = getProduction(state);
  const profileSetupOptions = buildProfileSetupProgressOptions({
    profile,
    preview,
    production,
  });

  const previewLine = previewHasContent(preview)
    ? `已有预览成稿（节选）：${previewPlainText(preview, 200)}`
    : "尚无预览成稿";

  const profileBlock = isProfileSetupPhase(profile, profileSetupOptions)
    ? [
        buildProfileStepPromptSection(profile, profileSetupOptions),
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
