import type { AgentStateType } from "#agent/state.js";

export function buildWorkTitleSection(state: AgentStateType): string {
  const workTitle = state.workTitle?.trim() || "（未命名作品）";
  return `## 作品标题
${workTitle}`;
}
