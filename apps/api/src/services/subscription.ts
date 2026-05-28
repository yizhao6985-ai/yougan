import {
  addBillingPeriod,
  getPlanDefinition,
  type BillingCycle,
  type SubscriptionPlanId,
} from "../lib/subscription-plans.js";
import { prisma } from "../db.js";

export type SubscriptionSummary = {
  planId: SubscriptionPlanId;
  planName: string;
  planDescription: string;
  status: string;
  billingCycle: BillingCycle | null;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  aiUsageThisPeriod: number;
  aiQuotaThisPeriod: number;
  cancelAtPeriodEnd: boolean;
  features: string[];
};

function normalizePlanId(planId: string): SubscriptionPlanId {
  return planId === "pro" ? "pro" : "free";
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfUtcMonth(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );
}

async function refreshSubscriptionPeriod(userId: string) {
  const subscription = await prisma.userSubscription.findUnique({
    where: { userId },
  });
  if (!subscription) return null;

  const now = new Date();
  const planId = normalizePlanId(subscription.planId);

  if (planId === "free") {
    const periodStart = startOfUtcMonth(now);
    const periodEnd = endOfUtcMonth(now);
    const storedStart = subscription.currentPeriodStart;

    if (
      storedStart.getUTCFullYear() !== periodStart.getUTCFullYear() ||
      storedStart.getUTCMonth() !== periodStart.getUTCMonth()
    ) {
      return prisma.userSubscription.update({
        where: { userId },
        data: {
          planId: "free",
          status: "active",
          billingCycle: null,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          aiUsageThisPeriod: 0,
          cancelAtPeriodEnd: false,
        },
      });
    }

    return subscription;
  }

  if (
    subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd.getTime() <= now.getTime()
  ) {
    if (subscription.cancelAtPeriodEnd) {
      const periodStart = startOfUtcMonth(now);
      const periodEnd = endOfUtcMonth(now);
      return prisma.userSubscription.update({
        where: { userId },
        data: {
          planId: "free",
          status: "active",
          billingCycle: null,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          aiUsageThisPeriod: 0,
          cancelAtPeriodEnd: false,
        },
      });
    }

    const billingCycle = (subscription.billingCycle ?? "monthly") as BillingCycle;
    const nextStart = subscription.currentPeriodEnd;
    const nextEnd = addBillingPeriod(nextStart, billingCycle);
    return prisma.userSubscription.update({
      where: { userId },
      data: {
        status: "active",
        currentPeriodStart: nextStart,
        currentPeriodEnd: nextEnd,
        aiUsageThisPeriod: 0,
      },
    });
  }

  return subscription;
}

export async function ensureUserSubscription(userId: string) {
  const existing = await prisma.userSubscription.findUnique({
    where: { userId },
  });
  if (existing) {
    return refreshSubscriptionPeriod(userId);
  }

  const now = new Date();
  return prisma.userSubscription.create({
    data: {
      userId,
      planId: "free",
      status: "active",
      currentPeriodStart: startOfUtcMonth(now),
      currentPeriodEnd: endOfUtcMonth(now),
    },
  });
}

export async function getSubscriptionSummary(
  userId: string,
): Promise<SubscriptionSummary> {
  const subscription = await ensureUserSubscription(userId);
  const planId = normalizePlanId(subscription!.planId);
  const plan = getPlanDefinition(planId);

  return {
    planId,
    planName: plan.name,
    planDescription: plan.description,
    status: subscription!.status,
    billingCycle: (subscription!.billingCycle as BillingCycle | null) ?? null,
    currentPeriodStart: subscription!.currentPeriodStart.toISOString(),
    currentPeriodEnd: subscription!.currentPeriodEnd?.toISOString() ?? null,
    aiUsageThisPeriod: subscription!.aiUsageThisPeriod,
    aiQuotaThisPeriod: plan.monthlyAiQuota,
    cancelAtPeriodEnd: subscription!.cancelAtPeriodEnd,
    features: plan.features,
  };
}

/** 支付成功后由 Billing 模块调用，开通/续期 Pro 权益 */
export async function activateProFromPayment(
  userId: string,
  input: {
    planId: SubscriptionPlanId;
    billingCycle: BillingCycle;
    paidAt: Date;
  },
): Promise<SubscriptionSummary> {
  if (input.planId !== "pro") {
    throw new Error("INVALID_PLAN");
  }

  const periodEnd = addBillingPeriod(input.paidAt, input.billingCycle);

  await prisma.userSubscription.upsert({
    where: { userId },
    create: {
      userId,
      planId: input.planId,
      status: "active",
      billingCycle: input.billingCycle,
      currentPeriodStart: input.paidAt,
      currentPeriodEnd: periodEnd,
      aiUsageThisPeriod: 0,
      cancelAtPeriodEnd: false,
    },
    update: {
      planId: input.planId,
      status: "active",
      billingCycle: input.billingCycle,
      currentPeriodStart: input.paidAt,
      currentPeriodEnd: periodEnd,
      aiUsageThisPeriod: 0,
      cancelAtPeriodEnd: false,
    },
  });

  return getSubscriptionSummary(userId);
}

/** 退款成功后由 Billing 模块调用，按策略收回 Pro 权益 */
export async function revokeProAfterRefund(
  userId: string,
  _context: { orderId: string; refundedAt: Date },
): Promise<SubscriptionSummary> {
  const now = new Date();
  const periodStart = startOfUtcMonth(now);
  const periodEnd = endOfUtcMonth(now);

  await prisma.userSubscription.upsert({
    where: { userId },
    create: {
      userId,
      planId: "free",
      status: "active",
      billingCycle: null,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      aiUsageThisPeriod: 0,
      cancelAtPeriodEnd: false,
    },
    update: {
      planId: "free",
      status: "active",
      billingCycle: null,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      aiUsageThisPeriod: 0,
      cancelAtPeriodEnd: false,
    },
  });

  return getSubscriptionSummary(userId);
}

export async function consumeAiUsage(userId: string): Promise<{
  allowed: boolean;
  summary: SubscriptionSummary;
}> {
  const subscription = await ensureUserSubscription(userId);
  const planId = normalizePlanId(subscription!.planId);
  const plan = getPlanDefinition(planId);

  if (subscription!.aiUsageThisPeriod >= plan.monthlyAiQuota) {
    return {
      allowed: false,
      summary: await getSubscriptionSummary(userId),
    };
  }

  await prisma.userSubscription.update({
    where: { userId },
    data: { aiUsageThisPeriod: { increment: 1 } },
  });

  return {
    allowed: true,
    summary: await getSubscriptionSummary(userId),
  };
}

export async function cancelSubscriptionAtPeriodEnd(userId: string) {
  const subscription = await ensureUserSubscription(userId);
  if (normalizePlanId(subscription!.planId) === "free") {
    throw new Error("ALREADY_FREE");
  }

  await prisma.userSubscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: true },
  });

  return getSubscriptionSummary(userId);
}

export async function resumeSubscription(userId: string) {
  const subscription = await ensureUserSubscription(userId);
  if (normalizePlanId(subscription!.planId) === "free") {
    throw new Error("ALREADY_FREE");
  }

  await prisma.userSubscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: false },
  });

  return getSubscriptionSummary(userId);
}
