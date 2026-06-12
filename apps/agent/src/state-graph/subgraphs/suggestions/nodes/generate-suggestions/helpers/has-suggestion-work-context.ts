/** 判断作品是否已有已提交进展（读 state 顶层，不含 production 内部计划） */
import { profileSummary } from "#agent/prompts/profile-summary.js";
import type { AgentStateType } from "#agent/state.js";

export function hasSuggestionWorkContext(state: AgentStateType): boolean {
  if (state.production?.preview?.body?.trim()) return true;

  const profile = state.profile;
  if (profile && profileSummary(profile) !== "尚无作品方案") return true;

  return false;
}
