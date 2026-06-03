import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import type { Work, WorkConversation } from "@/lib/types";

interface UseOpeningBootstrapQueryOptions {
  work: Work | null;
  conversation: WorkConversation | null;
  token: string | null;
  messageCount: number;
  isThreadLoading: boolean;
  submitOpeningBootstrap: () => Promise<void>;
}

export function useOpeningBootstrapQuery({
  work,
  conversation,
  token,
  messageCount,
  isThreadLoading,
  submitOpeningBootstrap,
}: UseOpeningBootstrapQueryOptions) {
  const workId = work?.id ?? null;
  const conversationId = conversation?.id ?? null;

  const enabled =
    Boolean(workId && conversationId && work && conversation && token) &&
    messageCount === 0 &&
    !isThreadLoading;

  return useQuery({
    queryKey:
      workId && conversationId
        ? queryKeys.works.openingBootstrap(workId, conversationId)
        : (["works", "opening-bootstrap", "disabled"] as const),
    queryFn: submitOpeningBootstrap,
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
}
