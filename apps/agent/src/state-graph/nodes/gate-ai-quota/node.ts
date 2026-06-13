/** 图入口：API 注入 usageExceeded 时短路，不进入 planTurnQueue */
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

export async function gateAiQuotaNode(
  state: AgentStateType,
): Promise<AgentStatePatch> {
  if (!state.usageExceeded) return {};
  return {};
}
