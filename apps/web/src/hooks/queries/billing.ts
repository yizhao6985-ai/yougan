import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import {
  checkoutBillingOrder,
  fetchBillingOrders,
  refundBillingOrder,
  type BillingCycle,
} from "@/services/billing";

export function useBillingOrdersQuery() {
  return useQuery({
    queryKey: queryKeys.billing.orders,
    queryFn: fetchBillingOrders,
    select: (data) => data.orders,
  });
}

export function useCheckoutBillingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { planId: "pro"; billingCycle: BillingCycle }) =>
      checkoutBillingOrder(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.billing.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.subscription.all,
      });
    },
  });
}

export function useRefundBillingOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => refundBillingOrder(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.billing.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.subscription.all,
      });
    },
  });
}
