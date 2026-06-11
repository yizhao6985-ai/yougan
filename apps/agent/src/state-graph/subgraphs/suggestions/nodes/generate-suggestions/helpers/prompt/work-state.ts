import { EMPTY_WORK_PROFILE, EMPTY_WORK_REFERENCES } from "@yougan/domain";

import {
  profileSummary,
  profileReferencesSummary,
} from "#agent/prompts/profile-summary.js";
import type { AgentStateType } from "#agent/state.js";

export function buildWorkStateSection(state: AgentStateType): string {
  const profile = state.profile ?? EMPTY_WORK_PROFILE;
  const references = state.references?.length
    ? state.references
    : [...EMPTY_WORK_REFERENCES];
  const preview = state.preview;

  const previewLine = preview?.body?.trim()
    ? `已有预览正文（节选）：${preview.body.slice(0, 200)}…`
    : "尚无预览成稿";

  return `## 作品状态
${profileSummary(profile, references)}
${profileReferencesSummary(references)}
${previewLine}`;
}
