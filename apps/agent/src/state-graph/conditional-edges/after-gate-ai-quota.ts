/** gateAiQuota 之后：额度已满则直接结算 metering 并结束，否则进入 planTurnQueue */
import type { AgentStateType } from "#agent/state.js";

export const from = "gateAiQuota" as const;

export type AfterGateAiQuotaTarget = "finalizeRunMetering" | "planTurnQueue";

export function selectAfterGateAiQuota(
  state: AgentStateType,
): AfterGateAiQuotaTarget {
  return state.usageExceeded ? "finalizeRunMetering" : "planTurnQueue";
}

export const paths = {
  finalizeRunMetering: "finalizeRunMetering",
  planTurnQueue: "planTurnQueue",
} as const;
