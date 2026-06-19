import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckIcon, CrownIcon, SparklesIcon } from "lucide-react";

import {
  SettingsNotice,
  SettingsPageHeader,
  SettingsPanelCard,
} from "@/components/settings/settings-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCheckoutBillingMutation } from "@/hooks/queries/billing";
import {
  useCancelSubscriptionMutation,
  useResumeSubscriptionMutation,
  useSubscriptionPlansQuery,
  useSubscriptionQuery,
} from "@/hooks/queries/subscription";
import { BILLING, MEMBERSHIP } from "@/lib/site-copy";
import { ApiError } from "@/services/client";
import type { BillingCycle } from "@/services/billing";
import { cn } from "@/lib/utils";

type PaidPlanId = "pro" | "pro_plus";

function formatPeriodEnd(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function planBadgeLabel(planId: string) {
  if (planId === "pro_plus") return MEMBERSHIP.proPlusBadge;
  if (planId === "pro") return MEMBERSHIP.proBadge;
  return MEMBERSHIP.freeBadge;
}

export function MembershipSettingsPanel() {
  const { data: subscription, isLoading: subscriptionLoading } =
    useSubscriptionQuery();
  const { data: plans = [] } = useSubscriptionPlansQuery();
  const checkoutMutation = useCheckoutBillingMutation();
  const cancelMutation = useCancelSubscriptionMutation();
  const resumeMutation = useResumeSubscriptionMutation();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [checkoutPlanId, setCheckoutPlanId] = useState<PaidPlanId>("pro");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const usagePercent = subscription?.usagePercent ?? 0;
  const isPaid =
    subscription?.planId === "pro" ||
    subscription?.planId === "pro_plus";
  const periodEndLabel = formatPeriodEnd(subscription?.currentPeriodEnd);
  const paidPlans = useMemo(
    () => plans.filter((plan) => plan.id === "pro" || plan.id === "pro_plus"),
    [plans],
  );

  const handleCheckout = async (planId: PaidPlanId) => {
    setError(null);
    setNotice(null);
    try {
      await checkoutMutation.mutateAsync({
        planId,
        billingCycle,
      });
      setNotice("套餐已开通，可在「订单与支付」查看账单");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "开通失败，请稍后再试");
    }
  };

  const handleCancel = async () => {
    setError(null);
    setNotice(null);
    try {
      await cancelMutation.mutateAsync();
      setNotice("已设置到期后不再续费");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "操作失败");
    }
  };

  const handleResume = async () => {
    setError(null);
    setNotice(null);
    try {
      await resumeMutation.mutateAsync();
      setNotice("已恢复自动续费");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "操作失败");
    }
  };

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title={MEMBERSHIP.pageTitle}
        description={MEMBERSHIP.pageDescription}
      />

      <SettingsPanelCard title={MEMBERSHIP.currentPlan}>
        {subscriptionLoading || !subscription ? (
          <p className="text-sm text-muted-foreground">加载中…</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {subscription.planName}
                  </h3>
                  <Badge variant={isPaid ? "default" : "secondary"}>
                    {planBadgeLabel(subscription.planId)}
                  </Badge>
                  {subscription.cancelAtPeriodEnd ? (
                    <Badge variant="outline">到期降级</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {subscription.planDescription}
                </p>
                {periodEndLabel ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {MEMBERSHIP.periodEnd(periodEndLabel)}
                  </p>
                ) : null}
              </div>

              {isPaid ? (
                <div className="flex flex-wrap gap-2">
                  {subscription.cancelAtPeriodEnd ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={resumeMutation.isPending}
                      onClick={() => void handleResume()}
                    >
                      {MEMBERSHIP.resumeSubscription}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={cancelMutation.isPending}
                      onClick={() => void handleCancel()}
                    >
                      {MEMBERSHIP.cancelAtPeriodEnd}
                    </Button>
                  )}
                </div>
              ) : null}
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-foreground">
                  {MEMBERSHIP.usageTitle}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  已用 {usagePercent}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-md bg-muted">
                <div
                  className={cn(
                    "h-full rounded-md transition-all",
                    usagePercent >= 100
                      ? "bg-destructive"
                      : usagePercent >= 80
                        ? "bg-amber-500"
                        : "bg-primary",
                  )}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {MEMBERSHIP.usageHint(usagePercent)}
              </p>
              {usagePercent >= 100 ? (
                <p className="mt-2 text-xs text-destructive">
                  {MEMBERSHIP.usageExceeded}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </SettingsPanelCard>

      {!isPaid ? (
        <SettingsPanelCard title={MEMBERSHIP.plansTitle}>
          <div className="mb-4 inline-flex rounded-lg border border-border/80 bg-muted/40 p-1">
            {(["monthly", "yearly"] as const).map((cycle) => (
              <button
                key={cycle}
                type="button"
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm transition",
                  billingCycle === cycle
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setBillingCycle(cycle)}
              >
                {cycle === "yearly" ? "年付更省" : "月付"}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {paidPlans.map((plan) => {
              const isSelected = checkoutPlanId === plan.id;
              const priceLabel =
                billingCycle === "yearly"
                  ? plan.priceYearlyLabel
                  : plan.priceMonthlyLabel;
              const cycleSuffix =
                billingCycle === "yearly" ? "/ 年" : "/ 月";

              return (
                <article
                  key={plan.id}
                  className={cn(
                    "rounded-lg border p-5 transition",
                    isSelected
                      ? "border-primary/30 bg-primary/5 shadow-sm"
                      : plan.highlighted
                        ? "border-primary/20 bg-primary/[0.03]"
                        : "border-border/80 bg-card",
                  )}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setCheckoutPlanId(plan.id as PaidPlanId)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {plan.highlighted ? (
                            <CrownIcon className="size-4 text-primary" />
                          ) : (
                            <SparklesIcon className="size-4 text-muted-foreground" />
                          )}
                          <h3 className="font-semibold text-foreground">
                            {plan.name}
                          </h3>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {plan.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-semibold text-foreground">
                          {priceLabel}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cycleSuffix}
                        </p>
                      </div>
                    </div>
                  </button>

                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    type="button"
                    className="mt-5 w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    disabled={checkoutMutation.isPending}
                    onClick={() => void handleCheckout(plan.id as PaidPlanId)}
                  >
                    {checkoutMutation.isPending
                      ? MEMBERSHIP.checkoutPending
                      : MEMBERSHIP.checkoutButton(
                          plan.name,
                          billingCycle === "yearly" ? "年付" : "月付",
                        )}
                  </Button>
                </article>
              );
            })}
          </div>

          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            {BILLING.mockPaymentNotice}{" "}
            {MEMBERSHIP.payOnBillingPage}
            <Link
              to="/settings/billing"
              className="text-primary underline-offset-2 hover:underline"
            >
              {MEMBERSHIP.payOnBillingLink}
            </Link>
            。
          </p>
        </SettingsPanelCard>
      ) : (
        <p className="text-sm text-muted-foreground">
          {MEMBERSHIP.payOnBillingPage}
          <Link
            to="/settings/billing"
            className="text-primary underline-offset-2 hover:underline"
          >
            {MEMBERSHIP.payOnBillingLink}
          </Link>
        </p>
      )}

      {notice ? <SettingsNotice tone="success">{notice}</SettingsNotice> : null}
      {error ? <SettingsNotice tone="error">{error}</SettingsNotice> : null}
    </div>
  );
}
