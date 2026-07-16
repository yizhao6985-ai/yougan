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

import { isPlaceholderWorkTitle } from "./work-title.js";

export function buildWorkStateSection(
  state: AgentStateType,
  options?: {
    profileSetupFocus?: ProfileSetupSuggestionFocus;
    omitSuggestionExamples?: boolean;
  },
): string {
  const profile = getProfile(state);
  const references = state.references?.length
    ? state.references
    : [...EMPTY_WORK_REFERENCES];
  const preview = getPreview(state);
  const production = getProduction(state);
  // 标题或体裁已明确时，不再注入跨形态/通用选题示例，避免建议串题
  const omitSuggestionExamples =
    options?.omitSuggestionExamples ??
    (!isPlaceholderWorkTitle(state.workTitle) ||
      Boolean(profile.direction.format));
  const profileSetupOptions = {
    ...buildProfileSetupProgressOptions({
      profile,
      preview,
      production,
    }),
    omitSuggestionExamples,
  };

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
              { omitSuggestionExamples },
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
