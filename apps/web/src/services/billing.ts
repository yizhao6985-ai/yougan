import { apiFetch } from "@/services/client";
import type { components } from "@/services/generated/schema";
import type { SubscriptionSummary } from "@/services/subscription";

export type BillingOrder = components["schemas"]["BillingOrder"];
export type BillingCycle = BillingOrder["billingCycle"];

export async function fetchBillingOrders() {
  return apiFetch<{ orders: BillingOrder[] }>("/api/billing/orders");
}

export async function checkoutBillingOrder(input: {
  planId: "pro" | "pro_plus";
  billingCycle: BillingCycle;
}) {
  return apiFetch<{ orderId: string; subscription: SubscriptionSummary }>(
    "/api/billing/checkout",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function refundBillingOrder(orderId: string) {
  return apiFetch<{
    order: BillingOrder;
    subscription: SubscriptionSummary;
  }>(`/api/billing/orders/${orderId}/refund`, { method: "POST" });
}
