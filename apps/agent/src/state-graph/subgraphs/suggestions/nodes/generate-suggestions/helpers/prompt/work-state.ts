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

  const previewStageNote = previewHasContent(preview)
    ? `

## 成稿阶段建议对齐（与 turn 路由一致）
- **扩展向**：给出针对当前成稿的具体改稿说法（用户发送后将进入 collectRevision，如「标题改成…」「第二段语气再软一点」）
- **引导向**：互斥覆盖「开始改稿」「继续补充改稿意见」「重写一版」三类动作之一；禁止空泛「继续优化」`
    : "";

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
${previewLine}${previewStageNote}`;
}
