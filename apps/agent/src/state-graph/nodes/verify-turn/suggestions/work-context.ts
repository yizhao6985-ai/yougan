/** 判断是否已有作品进展（canonical + staging，staging 经 get* 已优先） */
import {
  productionPlanSummary,
  profileSummary,
} from "@yougan/domain";

import {
  getPreview,
  getProductionPlan,
  getProfile,
} from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export function hasSuggestionWorkContext(state: AgentStateType): boolean {
  if (getPreview(state)?.body?.trim()) return true;

  const profile = getProfile(state);
  if (profileSummary(profile) !== "尚无作品方案") return true;

  const plan = getProductionPlan(state);
  if (productionPlanSummary(plan) !== "尚无内部创作计划") return true;

  return false;
}
