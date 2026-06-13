import {
  billingCycleLabel,
  formatPriceYuan,
  getPlanDefinition,
  getPlanPriceCents,
  type BillingCycle,
  type SubscriptionPlanId,
} from "../lib/subscription-plans.js";
import { prisma } from "../db.js";
import {
  activateProFromPayment,
  getSubscriptionSummary,
  revokeProAfterRefund,
  type SubscriptionSummary,
} from "./subscription.js";

export type BillingOrderDTO = {
  id: string;
  planId: string;
  planName: string;
  billingCycle: BillingCycle;
  amountCents: number;
  amountLabel: string;
  currency: string;
  status: string;
  description: string;
  paidAt: string | null;
  createdAt: string;
};

export async function listBillingOrders(
  userId: string,
): Promise<BillingOrderDTO[]> {
  const orders = await prisma.billingOrder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return orders.map((order) => {
    const plan = getPlanDefinition(order.planId);
    return {
      id: order.id,
      planId: order.planId,
      planName: plan.name,
      billingCycle: order.billingCycle as BillingCycle,
      amountCents: order.amountCents,
      amountLabel: formatPriceYuan(order.amountCents),
      currency: order.currency,
      status: order.status,
      description: order.description,
      paidAt: order.paidAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
    };
  });
}

export async function checkoutBillingOrder(
  userId: string,
  input: { planId: SubscriptionPlanId; billingCycle: BillingCycle },
): Promise<{ orderId: string; subscription: SubscriptionSummary }> {
  if (input.planId !== "pro" && input.planId !== "pro_plus") {
    throw new Error("INVALID_PLAN");
  }

  const amountCents = getPlanPriceCents(input.planId, input.billingCycle);
  const plan = getPlanDefinition(input.planId);
  const description = `${plan.name} · ${billingCycleLabel(input.billingCycle)}`;

  const order = await prisma.billingOrder.create({
    data: {
      userId,
      planId: input.planId,
      billingCycle: input.billingCycle,
      amountCents,
      description,
      status: "pending",
    },
  });

  const now = new Date();

  try {
    await prisma.billingOrder.update({
      where: { id: order.id },
      data: {
        status: "paid",
        paidAt: now,
      },
    });

    const subscription = await activateProFromPayment(userId, {
      planId: input.planId,
      billingCycle: input.billingCycle,
      paidAt: now,
    });

    return { orderId: order.id, subscription };
  } catch (error) {
    await prisma.billingOrder.update({
      where: { id: order.id },
      data: { status: "failed" },
    });
    throw error;
  }
}

export async function refundBillingOrder(userId: string, orderId: string) {
  const order = await prisma.billingOrder.findFirst({
    where: { id: orderId, userId },
  });

  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.status !== "paid") throw new Error("ORDER_NOT_REFUNDABLE");

  const now = new Date();

  await prisma.$transaction([
    prisma.billingOrder.update({
      where: { id: order.id },
      data: { status: "refunded" },
    }),
  ]);

  const subscription = await revokeProAfterRefund(userId, {
    orderId: order.id,
    refundedAt: now,
  });

  return {
    order: (await listBillingOrders(userId)).find((o) => o.id === orderId)!,
    subscription,
  };
}
