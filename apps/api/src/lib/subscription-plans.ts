export const SUBSCRIPTION_PLAN_IDS = ["free", "pro", "pro_plus"] as const;
export type SubscriptionPlanId = (typeof SUBSCRIPTION_PLAN_IDS)[number];

export const BILLING_CYCLES = ["monthly", "yearly"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export type SubscriptionPlanDefinition = {
  id: SubscriptionPlanId;
  name: string;
  description: string;
  /** 本周期 API 预算（microCredits；1 = ¥0.0001） */
  monthlyQuotaMicroCredits: number;
  priceMonthlyCents: number;
  priceYearlyCents: number;
  features: string[];
  highlighted?: boolean;
};

export const SUBSCRIPTION_PLANS: Record<
  SubscriptionPlanId,
  SubscriptionPlanDefinition
> = {
  free: {
    id: "free",
    name: "免费版",
    description: "体验完整创作流程，适合轻度使用",
    monthlyQuotaMicroCredits: 800_000,
    priceMonthlyCents: 0,
    priceYearlyCents: 0,
    features: [
      "每月 AI 创作额度",
      "灵感 · 创作 · 提问全流程",
      "作品分组与云端同步",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "适合周更创作，旗舰出稿与更高额度",
    monthlyQuotaMicroCredits: 2_550_000,
    priceMonthlyCents: 6800,
    priceYearlyCents: 67800,
    features: [
      "更高 AI 创作额度",
      "旗舰模型出稿",
      "发布到有感公域",
    ],
  },
  pro_plus: {
    id: "pro_plus",
    name: "Pro+",
    description: "适合日更与高频出稿，优先响应",
    monthlyQuotaMicroCredits: 5_200_000,
    priceMonthlyCents: 12800,
    priceYearlyCents: 127800,
    highlighted: true,
    features: [
      "充足 AI 创作额度",
      "旗舰模型全场景",
      "优先响应",
    ],
  },
};

export function resolvePlanId(planId: string): SubscriptionPlanId {
  if (planId in SUBSCRIPTION_PLANS) {
    return planId as SubscriptionPlanId;
  }
  return "free";
}

export function getPlanDefinition(planId: string): SubscriptionPlanDefinition {
  return SUBSCRIPTION_PLANS[resolvePlanId(planId)];
}

export function isPaidPlanId(planId: string): boolean {
  const resolved = resolvePlanId(planId);
  return resolved === "pro" || resolved === "pro_plus";
}

export function getPlanPriceCents(
  planId: SubscriptionPlanId,
  billingCycle: BillingCycle,
): number {
  const plan = SUBSCRIPTION_PLANS[planId];
  return billingCycle === "yearly"
    ? plan.priceYearlyCents
    : plan.priceMonthlyCents;
}

export function formatPriceYuan(cents: number): string {
  if (cents === 0) return "免费";
  const yuan = cents / 100;
  return Number.isInteger(yuan) ? `¥${yuan}` : `¥${yuan.toFixed(2)}`;
}

export function billingCycleLabel(cycle: BillingCycle): string {
  return cycle === "yearly" ? "年付" : "月付";
}

export function addBillingPeriod(
  start: Date,
  billingCycle: BillingCycle,
): Date {
  const end = new Date(start);
  if (billingCycle === "yearly") {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}
