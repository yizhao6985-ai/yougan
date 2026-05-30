import { Router } from "express";
import { z } from "zod";

import { BILLING_CYCLES } from "../lib/subscription-plans.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { routeParam } from "../lib/route-params.js";
import {
  checkoutBillingOrder,
  listBillingOrders,
  refundBillingOrder,
} from "../services/billing.js";

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
        routeParam(req.params.orderId, "orderId"),
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
