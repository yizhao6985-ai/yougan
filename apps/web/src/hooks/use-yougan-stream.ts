import { useCallback, useEffect, useMemo, useRef } from "react";

import type { Message } from "@langchain/langgraph-sdk";
import { useStream } from "@langchain/langgraph-sdk/react";

import { buildHumanMessageContent } from "@/lib/build-human-message-content";
import { normalizeBriefSuggestions } from "@/lib/brief-ui-spec";
import { applyGraphUpdatesToValues } from "@/lib/message-utils";
import { YOUGAN_ASSISTANT_ID } from "@/lib/yougan-chat-api";
import { LANGGRAPH_API_URL } from "@/lib/env";
import type { YouganValues, Work, WorkConversation } from "@/lib/types";
import { useAuthToken } from "@/store/auth";

/** LangGraph run 的 streamMode：values（每步全量 state）。节点内 token 增量走 updates，由 onUpdateEvent 合并。 */
const LANGGRAPH_STREAM_MODE = ["values"] as const;

interface UseYouganStreamOptions {
  work: Work | null;
  conversation: WorkConversation | null;
  modelTemperature: number;
  onThreadId?: (conversationId: string, threadId: string | null) => void;
  onRunComplete?: (workId: string, values: YouganValues) => void;
  onModeFromStream?: (
    conversationId: string,
    mode: NonNullable<YouganValues["mode"]>,
  ) => void;
}

export function useYouganStream({
  work,
  conversation,
  modelTemperature,
  onThreadId,
  onRunComplete,
  onModeFromStream,
}: UseYouganStreamOptions) {
  const threadId = conversation?.threadId ?? null;
  const workId = work?.id ?? null;
  const conversationId = conversation?.id ?? null;
  const token = useAuthToken();

  const defaultHeaders = useMemo(
    () => ({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(workId ? { "X-Work-Id": workId } : {}),
      ...(conversationId ? { "X-Conversation-Id": conversationId } : {}),
    }),
    [token, workId, conversationId],
  );

  const stream = useStream<YouganValues>({
    apiUrl: LANGGRAPH_API_URL,
    assistantId: YOUGAN_ASSISTANT_ID,
    threadId: threadId ?? undefined,
    defaultHeaders,
    throttle: false,
    onThreadId: (id) => {
      if (conversationId) onThreadId?.(conversationId, id);
    },
    onUpdateEvent: (update, { mutate }) => {
      mutate((prev) =>
        applyGraphUpdatesToValues(
          (prev ?? {}) as YouganValues & { messages?: Message[] },
          update as Record<string, unknown>,
        ),
      );
    },
  });

  const wasLoadingRef = useRef(false);
  const bootstrapAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId || !stream.values?.mode) {
      return;
    }

    onModeFromStream?.(conversationId, stream.values.mode);
  }, [conversationId, onModeFromStream, stream.values?.mode]);

  useEffect(() => {
    const wasLoading = wasLoadingRef.current;
    wasLoadingRef.current = stream.isLoading;

    if (!wasLoading || stream.isLoading) return;

    if (workId && stream.values) {
      onRunComplete?.(workId, stream.values);
    }
  }, [
    onRunComplete,
    stream.isLoading,
    stream.values,
    workId,
  ]);

  const bootstrapRecommendations = useCallback(
    async (options?: { force?: boolean }) => {
      if (!work || !conversation || !token) return;
      if (stream.isLoading) return;
      if (stream.messages.length > 0) return;

      if (!options?.force) {
        const existing = normalizeBriefSuggestions(stream.values?.briefSuggestions);
        if (existing) return;
      }

      await stream.submit(
        {
          mode: conversation.mode,
          workId: work.id,
          workTitle: work.title,
          conversationTitle: conversation.title,
          profile: work.profile,
          plan: work.plan,
          brief: work.brief,
          briefSuggestions: null,
          draft: work.draft,
          modelTemperature,
        },
        {
          streamMode: [...LANGGRAPH_STREAM_MODE],
        },
      );
    },
    [conversation, modelTemperature, stream, token, work],
  );

  useEffect(() => {
    if (!conversation?.id || !work || !token) return;
    if (stream.messages.length > 0) {
      bootstrapAttemptedRef.current = null;
      return;
    }
    if (bootstrapAttemptedRef.current === conversation.id) return;
    if (stream.isLoading) return;

    const existing = normalizeBriefSuggestions(stream.values?.briefSuggestions);
    if (existing) return;

    bootstrapAttemptedRef.current = conversation.id;
    void bootstrapRecommendations().catch(() => {
      bootstrapAttemptedRef.current = null;
    });
  }, [
    bootstrapRecommendations,
    conversation?.id,
    stream.isLoading,
    stream.messages.length,
    stream.values?.briefSuggestions,
    token,
    work,
  ]);

  const sendMessage = useCallback(
    async (text: string, imageUrls: string[] = []) => {
      const content = buildHumanMessageContent(text, imageUrls);
      const hasText =
        typeof content === "string" ? Boolean(content.trim()) : content.length > 0;
      if (!hasText || !work || !conversation) return;

      await stream.submit(
        {
          messages: [{ type: "human" as const, content }],
          mode: conversation.mode,
          workId: work.id,
          workTitle: work.title,
          conversationTitle: conversation.title,
          profile: work.profile,
          plan: work.plan,
          brief: work.brief,
          briefSuggestions: null,
          draft: work.draft,
          modelTemperature,
        },
        {
          streamMode: [...LANGGRAPH_STREAM_MODE],
        },
      );
    },
    [conversation, modelTemperature, stream, work],
  );

  return {
    stream,
    threadId,
    sendMessage,
    bootstrapRecommendations,
    canChat: Boolean(work && conversation && token),
  };
}

export type YouganStream = ReturnType<typeof useYouganStream>;
