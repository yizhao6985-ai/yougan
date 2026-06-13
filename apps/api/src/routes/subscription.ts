import { Router } from "express";
import {
  SUBSCRIPTION_PLAN_IDS,
  SUBSCRIPTION_PLANS,
  formatPriceYuan,
} from "../lib/subscription-plans.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  cancelSubscriptionAtPeriodEnd,
  getSubscriptionSummary,
  resumeSubscription,
} from "../services/subscription.js";

export const subscriptionRouter = Router();

subscriptionRouter.get("/plans", (_req, res) => {
  const plans = SUBSCRIPTION_PLAN_IDS.map((id) => {
    const plan = SUBSCRIPTION_PLANS[id];
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      priceMonthlyLabel: formatPriceYuan(plan.priceMonthlyCents),
      priceYearlyLabel: formatPriceYuan(plan.priceYearlyCents),
      priceMonthlyCents: plan.priceMonthlyCents,
      priceYearlyCents: plan.priceYearlyCents,
      features: plan.features,
      highlighted: plan.highlighted ?? false,
    };
  });

  res.json({ plans });
});

subscriptionRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const subscription = await getSubscriptionSummary(req.userId!);
  res.json({ subscription });
});

subscriptionRouter.post("/cancel", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const subscription = await cancelSubscriptionAtPeriodEnd(req.userId!);
    res.json({ subscription });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_FREE") {
      res.status(400).json({ error: "当前已是免费版" });
      return;
    }
    res.status(500).json({ error: "Cancel failed" });
  }
});

subscriptionRouter.post("/resume", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const subscription = await resumeSubscription(req.userId!);
    res.json({ subscription });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_FREE") {
      res.status(400).json({ error: "当前已是免费版" });
      return;
    }
    res.status(500).json({ error: "Resume failed" });
  }
});
