import {
  isUsageExceeded,
  toUsagePercent,
  type RunMetering,
} from "@yougan/domain";
import {
  addBillingPeriod,
  getPlanDefinition,
  isPaidPlanId,
  resolvePlanId,
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
  usagePercent: number;
  usageExceeded: boolean;
  cancelAtPeriodEnd: boolean;
  features: string[];
};

function normalizePlanId(planId: string): SubscriptionPlanId {
  return resolvePlanId(planId);
}

/** Agent run 前：DB 已用 + thread 内待结算 runMetering */
export async function getAgentRunQuotaContext(
  userId: string,
  pendingMicroCredits = 0,
): Promise<{ usageExceeded: boolean; summary: SubscriptionSummary }> {
  const subscription = await ensureUserSubscription(userId);
  const plan = getPlanDefinition(normalizePlanId(subscription!.planId));
  const effectiveUsage =
    subscription!.aiUsageMicroCredits + Math.max(0, pendingMicroCredits);
  const usageExceeded = isUsageExceeded(
    effectiveUsage,
    plan.monthlyQuotaMicroCredits,
  );
  const summary = buildSubscriptionSummary(subscription!);

  return {
    usageExceeded,
    summary: {
      ...summary,
      usagePercent: toUsagePercent(
        effectiveUsage,
        plan.monthlyQuotaMicroCredits,
      ),
      usageExceeded,
    },
  };
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

    if (storedStart.getTime() < periodStart.getTime()) {
      await prisma.userSubscription.update({
        where: { userId },
        data: {
          planId: "free",
          status: "active",
          billingCycle: null,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          aiUsageMicroCredits: 0,
        },
      });
    }
    return prisma.userSubscription.findUnique({ where: { userId } });
  }

  const periodEnd = subscription.currentPeriodEnd;
  if (periodEnd && now.getTime() > periodEnd.getTime()) {
    if (subscription.cancelAtPeriodEnd) {
      const freeStart = startOfUtcMonth(now);
      const freeEnd = endOfUtcMonth(now);
      await prisma.userSubscription.update({
        where: { userId },
        data: {
          planId: "free",
          status: "active",
          billingCycle: null,
          currentPeriodStart: freeStart,
          currentPeriodEnd: freeEnd,
          aiUsageMicroCredits: 0,
          cancelAtPeriodEnd: false,
        },
      });
    } else {
      const nextStart = periodEnd;
      const nextEnd = addBillingPeriod(
        nextStart,
        (subscription.billingCycle as BillingCycle) ?? "monthly",
      );
      await prisma.userSubscription.update({
        where: { userId },
        data: {
          currentPeriodStart: nextStart,
          currentPeriodEnd: nextEnd,
          aiUsageMicroCredits: 0,
        },
      });
    }
  }

  return prisma.userSubscription.findUnique({ where: { userId } });
}

export async function ensureUserSubscription(userId: string) {
  let subscription = await prisma.userSubscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    const now = new Date();
    subscription = await prisma.userSubscription.create({
      data: {
        userId,
        planId: "free",
        status: "active",
        currentPeriodStart: startOfUtcMonth(now),
        currentPeriodEnd: endOfUtcMonth(now),
      },
    });
  }

  return refreshSubscriptionPeriod(userId);
}

function buildSubscriptionSummary(
  subscription: NonNullable<Awaited<ReturnType<typeof ensureUserSubscription>>>,
): SubscriptionSummary {
  const planId = normalizePlanId(subscription.planId);
  const plan = getPlanDefinition(planId);
  const usagePercent = toUsagePercent(
    subscription.aiUsageMicroCredits,
    plan.monthlyQuotaMicroCredits,
  );

  return {
    planId,
    planName: plan.name,
    planDescription: plan.description,
    status: subscription.status,
    billingCycle: (subscription.billingCycle as BillingCycle | null) ?? null,
    currentPeriodStart: subscription.currentPeriodStart.toISOString(),
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
    usagePercent,
    usageExceeded: isUsageExceeded(
      subscription.aiUsageMicroCredits,
      plan.monthlyQuotaMicroCredits,
    ),
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    features: plan.features,
  };
}

export async function getSubscriptionSummary(
  userId: string,
): Promise<SubscriptionSummary> {
  const subscription = await ensureUserSubscription(userId);
  return buildSubscriptionSummary(subscription!);
}

/** 支付成功后开通/续期付费套餐 */
export async function activateProFromPayment(
  userId: string,
  input: {
    planId: SubscriptionPlanId;
    billingCycle: BillingCycle;
    paidAt: Date;
  },
): Promise<SubscriptionSummary> {
  if (!isPaidPlanId(input.planId)) {
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
      aiUsageMicroCredits: 0,
      cancelAtPeriodEnd: false,
    },
    update: {
      planId: input.planId,
      status: "active",
      billingCycle: input.billingCycle,
      currentPeriodStart: input.paidAt,
      currentPeriodEnd: periodEnd,
      aiUsageMicroCredits: 0,
      cancelAtPeriodEnd: false,
    },
  });

  return getSubscriptionSummary(userId);
}

/** 退款成功后收回付费权益 */
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
      aiUsageMicroCredits: 0,
      cancelAtPeriodEnd: false,
    },
    update: {
      planId: "free",
      status: "active",
      billingCycle: null,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      aiUsageMicroCredits: 0,
      cancelAtPeriodEnd: false,
    },
  });

  return getSubscriptionSummary(userId);
}

/** LangGraph run 开始前：DB 已用 + 待结算 runMetering 是否已满 */
export async function assertAiQuotaAvailable(
  userId: string,
  pendingMicroCredits = 0,
): Promise<{
  allowed: boolean;
  summary: SubscriptionSummary;
}> {
  const context = await getAgentRunQuotaContext(userId, pendingMicroCredits);
  return {
    allowed: !context.usageExceeded,
    summary: context.summary,
  };
}

/** LangGraph run 成功后：按 agent 上报的 microCredits 结算 */
export async function settleAiUsage(
  userId: string,
  input: {
    microCredits: number;
    idempotencyKey: string;
  },
): Promise<SubscriptionSummary> {
  if (input.microCredits <= 0) {
    return getSubscriptionSummary(userId);
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.aiUsageSettlement.findUnique({
      where: {
        userId_idempotencyKey: {
          userId,
          idempotencyKey: input.idempotencyKey,
        },
      },
    });
    if (existing) return;

    await tx.aiUsageSettlement.create({
      data: {
        userId,
        idempotencyKey: input.idempotencyKey,
        microCredits: input.microCredits,
      },
    });

    await tx.userSubscription.update({
      where: { userId },
      data: {
        aiUsageMicroCredits: { increment: input.microCredits },
      },
    });
  });

  return getSubscriptionSummary(userId);
}

export function parseRunMetering(values: Record<string, unknown>): RunMetering | null {
  const raw = values.runMetering;
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const microCredits =
    typeof record.microCredits === "number" ? record.microCredits : 0;
  const inputTokens =
    typeof record.inputTokens === "number" ? record.inputTokens : 0;
  const outputTokens =
    typeof record.outputTokens === "number" ? record.outputTokens : 0;
  const callCount = typeof record.callCount === "number" ? record.callCount : 0;
  if (microCredits <= 0) return null;
  return { microCredits, inputTokens, outputTokens, callCount };
}

/** @deprecated 使用 assertAiQuotaAvailable + settleAiUsage */
export async function consumeAiUsage(userId: string): Promise<{
  allowed: boolean;
  summary: SubscriptionSummary;
}> {
  return assertAiQuotaAvailable(userId);
}

export async function cancelSubscriptionAtPeriodEnd(userId: string) {
  const subscription = await ensureUserSubscription(userId);
  if (!isPaidPlanId(normalizePlanId(subscription!.planId))) {
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
  if (!isPaidPlanId(normalizePlanId(subscription!.planId))) {
    throw new Error("ALREADY_FREE");
  }

  await prisma.userSubscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: false },
  });

  return getSubscriptionSummary(userId);
}
