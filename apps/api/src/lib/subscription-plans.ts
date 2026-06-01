export const SUBSCRIPTION_PLAN_IDS = ["free", "pro"] as const;
export type SubscriptionPlanId = (typeof SUBSCRIPTION_PLAN_IDS)[number];

export const BILLING_CYCLES = ["monthly", "yearly"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export type SubscriptionPlanDefinition = {
  id: SubscriptionPlanId;
  name: string;
  description: string;
  monthlyAiQuota: number;
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
    monthlyAiQuota: 30,
    priceMonthlyCents: 0,
    priceYearlyCents: 0,
    features: [
      "每月 30 次 AI 创作",
      "灵感 · 创作 · 提问全流程",
      "作品分组与云端同步",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro 创作者",
    description: "更高额度与增强出稿，适合高频更新",
    monthlyAiQuota: 500,
    priceMonthlyCents: 2900,
    priceYearlyCents: 28800,
    highlighted: true,
    features: [
      "每月 500 次 AI 创作",
      "增强出稿质量与更长上下文",
      "优先响应与更多参考素材容量",
      "平台集成发布",
    ],
  },
};

export function getPlanDefinition(planId: string): SubscriptionPlanDefinition {
  if (planId in SUBSCRIPTION_PLANS) {
    return SUBSCRIPTION_PLANS[planId as SubscriptionPlanId];
  }
  return SUBSCRIPTION_PLANS.free;
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
