import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import type { Work, WorkConversation } from "@/lib/types";

interface UseOpeningBootstrapQueryOptions {
  work: Work | null;
  conversation: WorkConversation | null;
  token: string | null;
  messageCount: number;
  isThreadLoading: boolean;
  isCancelling: boolean;
  hasActiveRun: boolean;
  submitOpeningBootstrap: () => Promise<void>;
}

/** opening bootstrap 仅触发 side effect；query data 用 null 占位以满足 React Query 约束 */
type OpeningBootstrapQueryData = null;

export function useOpeningBootstrapQuery({
  work,
  conversation,
  token,
  messageCount,
  isThreadLoading,
  isCancelling,
  hasActiveRun,
  submitOpeningBootstrap,
}: UseOpeningBootstrapQueryOptions) {
  const workId = work?.id ?? null;
  const conversationId = conversation?.id ?? null;

  const enabled =
    Boolean(workId && conversationId && work && conversation && token) &&
    messageCount === 0 &&
    !isThreadLoading &&
    !isCancelling &&
    !hasActiveRun;

  return useQuery<OpeningBootstrapQueryData>({
    queryKey:
      workId && conversationId
        ? queryKeys.works.openingBootstrap(workId, conversationId)
        : (["works", "opening-bootstrap", "disabled"] as const),
    queryFn: async () => {
      await submitOpeningBootstrap();
      return null;
    },
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
}
