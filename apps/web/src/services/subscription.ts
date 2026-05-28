import { apiFetch } from "@/services/client";
import type { components } from "@/services/generated/schema";

export type SubscriptionPlan = components["schemas"]["SubscriptionPlan"];
export type SubscriptionSummary = components["schemas"]["SubscriptionSummary"];
export type BillingCycle = "monthly" | "yearly";

export async function fetchSubscriptionPlans() {
  return apiFetch<{ plans: SubscriptionPlan[] }>("/api/subscription/plans");
}

export async function fetchSubscription() {
  return apiFetch<{ subscription: SubscriptionSummary }>("/api/subscription");
}

export async function cancelSubscriptionAtPeriodEnd() {
  return apiFetch<{ subscription: SubscriptionSummary }>(
    "/api/subscription/cancel",
    { method: "POST" },
  );
}

export async function resumeSubscriptionRenewal() {
  return apiFetch<{ subscription: SubscriptionSummary }>(
    "/api/subscription/resume",
    { method: "POST" },
  );
}
