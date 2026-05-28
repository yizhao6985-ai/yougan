import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import {
  cancelSubscriptionAtPeriodEnd,
  fetchSubscription,
  fetchSubscriptionPlans,
  resumeSubscriptionRenewal,
} from "@/services/subscription";

export function useSubscriptionPlansQuery() {
  return useQuery({
    queryKey: queryKeys.subscription.plans,
    queryFn: fetchSubscriptionPlans,
    select: (data) => data.plans,
  });
}

export function useSubscriptionQuery() {
  return useQuery({
    queryKey: queryKeys.subscription.current,
    queryFn: fetchSubscription,
    select: (data) => data.subscription,
  });
}

export function useCancelSubscriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelSubscriptionAtPeriodEnd,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.subscription.all,
      });
    },
  });
}

export function useResumeSubscriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resumeSubscriptionRenewal,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.subscription.all,
      });
    },
  });
}
