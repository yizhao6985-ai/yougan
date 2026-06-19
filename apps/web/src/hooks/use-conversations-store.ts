import { useLocalStorageState, useMemoizedFn } from "ahooks";
import { useMemo } from "react";

import { DEFAULT_CONVERSATION_TITLE } from "@yougan/domain";

import {
  useCreateWorkConversationMutation,
  useDeleteWorkConversationMutation,
  useUpdateWorkConversationMutation,
  useWorkConversationsQuery,
} from "@/hooks/queries/conversations";
import { ACTIVE_CONVERSATION_BY_WORK_KEY } from "@/lib/env";
import type { WorkConversation } from "@/lib/types";

export function useConversationsStore(workId: string | null) {
  const [activeConversationMap, setActiveConversationMap] =
    useLocalStorageState<Record<string, string>>(ACTIVE_CONVERSATION_BY_WORK_KEY, {
      defaultValue: {},
    });
  const conversationsQuery = useWorkConversationsQuery(workId);
  const createConversationMutation = useCreateWorkConversationMutation(workId);
  const updateConversationMutation = useUpdateWorkConversationMutation(workId);
  const deleteConversationMutation = useDeleteWorkConversationMutation(workId);

  const conversations = conversationsQuery.data ?? [];
  const activeConversationId = workId
    ? (activeConversationMap?.[workId] ?? null)
    : null;

  const activeConversation = useMemo(() => {
    if (!conversations.length) return null;

    if (
      activeConversationId &&
      conversations.some((conversation) => conversation.id === activeConversationId)
    ) {
      return (
        conversations.find(
          (conversation) => conversation.id === activeConversationId,
        ) ?? null
      );
    }

    return conversations[0] ?? null;
  }, [activeConversationId, conversations]);

  const selectConversation = useMemoizedFn((conversationId: string) => {
    if (!workId) return;
    setActiveConversationMap((prev) => ({
      ...(prev ?? {}),
      [workId]: conversationId,
    }));
  });

  const createConversation = useMemoizedFn(
    async (options?: { title?: string }) => {
      const { conversation } = await createConversationMutation.mutateAsync(
        options,
      );
      const normalized: WorkConversation = {
        ...conversation,
        threadId: conversation.threadId ?? null,
      };
      if (workId) {
        setActiveConversationMap((prev) => ({
          ...(prev ?? {}),
          [workId]: normalized.id,
        }));
      }
      return normalized;
    },
  );

  const setConversationThreadId = useMemoizedFn(
    async (conversationId: string, threadId: string | null) => {
      if (!workId) return;
      await updateConversationMutation.mutateAsync({
        conversationId,
        patch: { threadId },
      });
    },
  );

  const deleteConversation = useMemoizedFn(async (conversationId: string) => {
    if (!workId) return;
    await deleteConversationMutation.mutateAsync(conversationId);
    setActiveConversationMap((prev) => {
      const current = prev ?? {};
      if (current[workId] !== conversationId) return current;
      const remaining = conversations.filter(
        (item) => item.id !== conversationId,
      );
      const next = { ...current };
      if (remaining[0]) next[workId] = remaining[0].id;
      else delete next[workId];
      return next;
    });
  });

  const renameConversation = useMemoizedFn(
    async (conversationId: string, title: string) => {
      if (!workId) return;
      const normalized = title.trim() || DEFAULT_CONVERSATION_TITLE;
      await updateConversationMutation.mutateAsync({
        conversationId,
        patch: { title: normalized },
      });
    },
  );

  return {
    conversations,
    activeConversation,
    conversationsLoading: conversationsQuery.isLoading,
    selectConversation,
    createConversation,
    setConversationThreadId,
    deleteConversation,
    renameConversation,
  };
}

export type ConversationsStore = ReturnType<typeof useConversationsStore>;
