import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";

import { queryKeys } from "@/hooks/queries/keys";
import { normalizeChatMode } from "@/lib/types";
import type { ChatMode, WorkConversation } from "@/lib/types";
import {
  createWorkConversation as apiCreateWorkConversation,
  deleteWorkConversation as apiDeleteWorkConversation,
  listWorkConversations,
  updateWorkConversation as apiUpdateWorkConversation,
} from "@/services/conversations";
import { useAuthToken } from "@/store/auth";

function normalizeConversation(conversation: WorkConversation): WorkConversation {
  return {
    ...conversation,
    mode: normalizeChatMode(conversation.mode),
    threadId: conversation.threadId ?? null,
  };
}

export function useWorkConversationsQuery(workId: string | null) {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.works.conversations(workId ?? ""),
    queryFn: async () => {
      const { conversations } = await listWorkConversations(workId!);
      return conversations.map(normalizeConversation);
    },
    enabled: Boolean(token && workId),
  });
}

export function patchConversationsCache(
  queryClient: ReturnType<typeof useQueryClient>,
  workId: string,
  updater: (conversations: WorkConversation[]) => WorkConversation[],
) {
  queryClient.setQueryData<WorkConversation[]>(
    queryKeys.works.conversations(workId),
    (current) => updater(current ?? []),
  );
}

export function useCreateWorkConversationMutation(workId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options?: { title?: string; mode?: ChatMode }) => {
      if (!workId) throw new Error("No active work");
      return apiCreateWorkConversation(workId, options);
    },
    onSuccess: ({ conversation }) => {
      if (!workId) return;
      const normalized = normalizeConversation(conversation);
      patchConversationsCache(queryClient, workId, (items) => [
        normalized,
        ...items,
      ]);
    },
  });
}

export function useUpdateWorkConversationMutation(workId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      patch,
    }: {
      conversationId: string;
      patch: Parameters<typeof apiUpdateWorkConversation>[2];
    }) => {
      if (!workId) throw new Error("No active work");
      return apiUpdateWorkConversation(workId, conversationId, patch);
    },
    onSuccess: ({ conversation }) => {
      if (!workId) return;
      const normalized = normalizeConversation(conversation);
      patchConversationsCache(queryClient, workId, (items) =>
        items.map((item) =>
          item.id === normalized.id ? normalized : item,
        ),
      );
    },
  });
}

export function useDeleteWorkConversationMutation(workId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => {
      if (!workId) throw new Error("No active work");
      return apiDeleteWorkConversation(workId, conversationId);
    },
    onSuccess: (_, conversationId) => {
      if (!workId) return;
      patchConversationsCache(queryClient, workId, (items) =>
        items.filter((item) => item.id !== conversationId),
      );
    },
  });
}

export function useInvalidateWorkConversations(workId: string | null) {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    if (!workId) return;
    await queryClient.invalidateQueries({
      queryKey: queryKeys.works.conversations(workId),
    });
  }, [queryClient, workId]);
}
