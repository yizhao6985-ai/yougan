import { useCallback, useMemo } from "react";
import { useAtom } from "jotai";
import { atom } from "jotai";

import {
  useCreateWorkConversationMutation,
  useDeleteWorkConversationMutation,
  useUpdateWorkConversationMutation,
  useWorkConversationsQuery,
} from "@/hooks/queries/conversations";
import { ACTIVE_CONVERSATION_BY_WORK_KEY } from "@/lib/env";
import type { WorkConversation } from "@/lib/types";

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
          ...prev,
          [workId]: normalized.id,
        }));
      }
      return normalized;
    },
    [createConversationMutation, setActiveConversationMap, workId],
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
    setConversationThreadId,
    deleteConversation,
  };
}

export type ConversationsStore = ReturnType<typeof useConversationsStore>;
