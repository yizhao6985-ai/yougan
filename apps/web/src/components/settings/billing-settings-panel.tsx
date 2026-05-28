import { useState } from "react";
import { Link } from "react-router-dom";

import {
  SettingsNotice,
  SettingsPageHeader,
  SettingsPanelCard,
} from "@/components/settings/settings-shell";
import { Button } from "@/components/ui/button";
import {
  useBillingOrdersQuery,
  useRefundBillingOrderMutation,
} from "@/hooks/queries/billing";
import { BILLING } from "@/lib/site-copy";
import { ApiError } from "@/services/client";

function orderStatusLabel(status: string) {
  return (
    BILLING.orderStatus[status as keyof typeof BILLING.orderStatus] ?? status
  );
}

export function BillingSettingsPanel() {
  const { data: orders = [], isLoading: ordersLoading } = useBillingOrdersQuery();
  const refundMutation = useRefundBillingOrderMutation();
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleRefund = async (orderId: string) => {
    if (!window.confirm(BILLING.refundConfirm)) return;

    setRefundingId(orderId);
    setError(null);
    setNotice(null);
    try {
      await refundMutation.mutateAsync(orderId);
      setNotice(BILLING.refundSuccess);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "退款失败");
    } finally {
      setRefundingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title={BILLING.pageTitle}
        description={BILLING.pageDescription}
      />

      <p className="text-sm text-muted-foreground">
        <Link
          to="/settings/membership"
          className="text-primary underline-offset-2 hover:underline"
        >
          {BILLING.membershipLink}
        </Link>
      </p>

      <SettingsPanelCard title={BILLING.ordersTitle}>
        {ordersLoading ? (
          <p className="text-sm text-muted-foreground">加载中…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">{BILLING.ordersEmpty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">时间</th>
                  <th className="pb-3 pr-4 font-medium">项目</th>
                  <th className="pb-3 pr-4 font-medium">金额</th>
                  <th className="pb-3 pr-4 font-medium">状态</th>
                  <th className="pb-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border/40">
                    <td className="py-3 pr-4 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString("zh-CN")}
                    </td>
                    <td className="py-3 pr-4">{order.description}</td>
                    <td className="py-3 pr-4 tabular-nums">{order.amountLabel}</td>
                    <td className="py-3 pr-4">{orderStatusLabel(order.status)}</td>
                    <td className="py-3">
                      {order.status === "paid" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={refundingId === order.id}
                          onClick={() => void handleRefund(order.id)}
                        >
                          {refundingId === order.id
                            ? BILLING.refundPending
                            : BILLING.refundButton}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SettingsPanelCard>

      <p className="text-xs leading-5 text-muted-foreground">
        {BILLING.mockPaymentNotice}
      </p>

      {notice ? <SettingsNotice tone="success">{notice}</SettingsNotice> : null}
      {error ? <SettingsNotice tone="error">{error}</SettingsNotice> : null}
    </div>
  );
}
