import { useCallback, useEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { atom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";

import {
  patchConversationsCache,
  useCreateWorkConversationMutation,
  useDeleteWorkConversationMutation,
  useUpdateWorkConversationMutation,
  useWorkConversationsQuery,
} from "@/hooks/queries/conversations";
import { queryKeys } from "@/hooks/queries/keys";
import { ACTIVE_CONVERSATION_BY_WORK_KEY } from "@/lib/env";
import type { ChatMode, WorkConversation } from "@/lib/types";
import { normalizeChatMode } from "@/lib/types";

function readActiveConversationMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ACTIVE_CONVERSATION_BY_WORK_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

const activeConversationByWorkBaseAtom = atom(readActiveConversationMap());

const activeConversationByWorkAtom = atom(
  (get) => get(activeConversationByWorkBaseAtom),
  (
    get,
    set,
    update:
      | Record<string, string>
      | ((prev: Record<string, string>) => Record<string, string>),
  ) => {
    const prev = get(activeConversationByWorkBaseAtom);
    const next = typeof update === "function" ? update(prev) : update;
    localStorage.setItem(
      ACTIVE_CONVERSATION_BY_WORK_KEY,
      JSON.stringify(next),
    );
    set(activeConversationByWorkBaseAtom, next);
  },
);

export function useConversationsStore(workId: string | null) {
  const queryClient = useQueryClient();
  const [activeConversationMap, setActiveConversationMap] = useAtom(
    activeConversationByWorkAtom,
  );
  const conversationsQuery = useWorkConversationsQuery(workId);
  const createConversationMutation = useCreateWorkConversationMutation(workId);
  const updateConversationMutation = useUpdateWorkConversationMutation(workId);
  const deleteConversationMutation = useDeleteWorkConversationMutation(workId);

  const conversations = conversationsQuery.data ?? [];
  const activeConversationId = workId
    ? (activeConversationMap[workId] ?? null)
    : null;

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) ??
      conversations[0] ??
      null,
    [activeConversationId, conversations],
  );

  useEffect(() => {
    if (!workId || conversationsQuery.isLoading) return;

    if (!conversations.length) return;

    setActiveConversationMap((prev) => {
      const currentId = prev[workId];
      if (currentId && conversations.some((item) => item.id === currentId)) {
        return prev;
      }
      return { ...prev, [workId]: conversations[0]!.id };
    });
  }, [
    conversations,
    conversationsQuery.isLoading,
    setActiveConversationMap,
    workId,
  ]);

  const selectConversation = useCallback(
    (conversationId: string) => {
      if (!workId) return;
      setActiveConversationMap((prev) => ({
        ...prev,
        [workId]: conversationId,
      }));
    },
    [setActiveConversationMap, workId],
  );

  const createConversation = useCallback(
    async (options?: { title?: string; mode?: ChatMode }) => {
      const { conversation } = await createConversationMutation.mutateAsync(
        options,
      );
      const normalized: WorkConversation = {
        ...conversation,
        mode: normalizeChatMode(conversation.mode),
        threadId: conversation.threadId ?? null,
      };
      if (workId) {
        setActiveConversationMap((prev) => ({
          ...prev,
          [workId]: normalized.id,
        }));
      }
      return normalized;
    },
    [createConversationMutation, setActiveConversationMap, workId],
  );

  const setConversationMode = useCallback(
    (conversationId: string, mode: ChatMode) => {
      if (!workId) return;
      patchConversationsCache(queryClient, workId, (items) =>
        items.map((item) =>
          item.id === conversationId ? { ...item, mode } : item,
        ),
      );
      void updateConversationMutation
        .mutateAsync({ conversationId, patch: { mode } })
        .catch(() => {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.works.conversations(workId),
          });
        });
    },
    [queryClient, updateConversationMutation, workId],
  );

  const syncModeFromStream = useCallback(
    async (conversationId: string, mode: ChatMode) => {
      if (!workId) return;
      const current = queryClient
        .getQueryData<WorkConversation[]>(
          queryKeys.works.conversations(workId),
        )
        ?.find((item) => item.id === conversationId);
      if (current?.mode === mode) return;
      await updateConversationMutation.mutateAsync({
        conversationId,
        patch: { mode },
      });
    },
    [queryClient, updateConversationMutation, workId],
  );

  const setConversationThreadId = useCallback(
    async (conversationId: string, threadId: string | null) => {
      if (!workId) return;
      await updateConversationMutation.mutateAsync({
        conversationId,
        patch: { threadId },
      });
    },
    [updateConversationMutation, workId],
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (!workId) return;
      await deleteConversationMutation.mutateAsync(conversationId);
      setActiveConversationMap((prev) => {
        if (prev[workId] !== conversationId) return prev;
        const remaining = conversations.filter(
          (item) => item.id !== conversationId,
        );
        const next = { ...prev };
        if (remaining[0]) next[workId] = remaining[0].id;
        else delete next[workId];
        return next;
      });
    },
    [
      conversations,
      deleteConversationMutation,
      setActiveConversationMap,
      workId,
    ],
  );

  return {
    conversations,
    activeConversation,
    conversationsLoading: conversationsQuery.isLoading,
    selectConversation,
    createConversation,
    setConversationMode,
    syncModeFromStream,
    setConversationThreadId,
    deleteConversation,
  };
}

export type ConversationsStore = ReturnType<typeof useConversationsStore>;
