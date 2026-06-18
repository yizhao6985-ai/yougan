import type { QueryClient } from "@tanstack/react-query";
import type { AiUsageSnapshot } from "@yougan/domain";

import { queryKeys } from "@/hooks/queries/keys";
import type { SubscriptionSummary } from "@/services/subscription";

export const AI_USAGE_EVENT = "ai_usage" as const;

export type AiUsageCustomPayload = {
  event: typeof AI_USAGE_EVENT;
  aiUsage: AiUsageSnapshot;
};

export function isAiUsageCustomPayload(
  data: unknown,
): data is AiUsageCustomPayload {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  if (record.event !== AI_USAGE_EVENT) return false;
  const aiUsage = record.aiUsage;
  return aiUsage != null && typeof aiUsage === "object";
}

export function subscriptionPatchFromAiUsage(
  aiUsage: AiUsageSnapshot,
  previous?: SubscriptionSummary | null,
): SubscriptionSummary {
  return {
    planId: (aiUsage.planId as SubscriptionSummary["planId"]) ?? previous?.planId ?? "free",
    planName: previous?.planName ?? "免费版",
    planDescription: previous?.planDescription ?? "",
    status: previous?.status ?? "active",
    billingCycle: previous?.billingCycle ?? null,
    currentPeriodStart: previous?.currentPeriodStart ?? new Date().toISOString(),
    currentPeriodEnd: previous?.currentPeriodEnd ?? null,
    usagePercent: aiUsage.usagePercent,
    usageExceeded: aiUsage.usageExceeded,
    cancelAtPeriodEnd: previous?.cancelAtPeriodEnd ?? false,
    features: previous?.features ?? [],
  };
}

/** LangGraph threads.updateState 响应（API proxy 注入顶层 aiUsage） */
export function aiUsageFromThreadState(
  state: unknown,
): AiUsageSnapshot | undefined {
  if (!state || typeof state !== "object") return undefined;
  const record = state as Record<string, unknown>;
  if (record.aiUsage && typeof record.aiUsage === "object") {
    return record.aiUsage as AiUsageSnapshot;
  }
  const values = record.values;
  if (values && typeof values === "object") {
    const aiUsage = (values as Record<string, unknown>).aiUsage;
    if (aiUsage && typeof aiUsage === "object") {
      return aiUsage as AiUsageSnapshot;
    }
  }
  return undefined;
}

export function syncSubscriptionCacheFromAiUsage(
  queryClient: QueryClient,
  aiUsage: AiUsageSnapshot | null | undefined,
) {
  if (!aiUsage) return;

  const previous = queryClient.getQueryData<{ subscription: SubscriptionSummary }>(
    queryKeys.subscription.current,
  )?.subscription;

  queryClient.setQueryData(queryKeys.subscription.current, {
    subscription: subscriptionPatchFromAiUsage(aiUsage, previous),
  });
}
