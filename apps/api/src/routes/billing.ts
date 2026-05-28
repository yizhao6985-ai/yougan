import { Router } from "express";
import { z } from "zod";

import { BILLING_CYCLES } from "../lib/subscription-plans.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  checkoutBillingOrder,
  listBillingOrders,
  refundBillingOrder,
} from "../services/billing.js";
import {
  cancelSubscriptionAtPeriodEnd,
  getSubscriptionSummary,
  resumeSubscription,
} from "../services/subscription.js";
import {
  SUBSCRIPTION_PLAN_IDS,
  SUBSCRIPTION_PLANS,
  formatPriceYuan,
} from "../lib/subscription-plans.js";

export const billingRouter = Router();

billingRouter.get("/orders", requireAuth, async (req: AuthedRequest, res) => {
  const orders = await listBillingOrders(req.userId!);
  res.json({ orders });
});

billingRouter.post("/checkout", requireAuth, async (req: AuthedRequest, res) => {
  const body = z
    .object({
      planId: z.enum(["pro"]),
      billingCycle: z.enum(BILLING_CYCLES),
    })
    .safeParse(req.body);

  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const result = await checkoutBillingOrder(req.userId!, body.data);
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_PLAN") {
      res.status(400).json({ error: "暂不支持该套餐" });
      return;
    }
    res.status(500).json({ error: "Checkout failed" });
  }
});

billingRouter.post(
  "/orders/:orderId/refund",
  requireAuth,
  async (req: AuthedRequest, res) => {
    try {
      const result = await refundBillingOrder(
        req.userId!,
        req.params.orderId,
      );
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "ORDER_NOT_FOUND") {
          res.status(404).json({ error: "订单不存在" });
          return;
        }
        if (error.message === "ORDER_NOT_REFUNDABLE") {
          res.status(400).json({ error: "仅已支付订单可退款" });
          return;
        }
      }
      res.status(500).json({ error: "Refund failed" });
    }
  },
);

/** @deprecated 请使用 GET /api/subscription */
billingRouter.get("/subscription", requireAuth, async (req: AuthedRequest, res) => {
  const subscription = await getSubscriptionSummary(req.userId!);
  res.json({ subscription });
});

/** @deprecated 请使用 GET /api/subscription/plans */
billingRouter.get("/plans", (_req, res) => {
  const plans = SUBSCRIPTION_PLAN_IDS.map((id) => {
    const plan = SUBSCRIPTION_PLANS[id];
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      monthlyAiQuota: plan.monthlyAiQuota,
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

/** @deprecated 请使用 POST /api/subscription/cancel */
billingRouter.post(
  "/subscription/cancel",
  requireAuth,
  async (req: AuthedRequest, res) => {
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
  },
);

/** @deprecated 请使用 POST /api/subscription/resume */
billingRouter.post(
  "/subscription/resume",
  requireAuth,
  async (req: AuthedRequest, res) => {
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
  },
);
