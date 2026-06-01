import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useStream } from "@langchain/langgraph-sdk/react";

import { buildHumanMessageContent } from "@/lib/build-human-message-content";
import { normalizeBriefSuggestions } from "@/lib/brief-ui-spec";
import { YOUGAN_ASSISTANT_ID, getYouganThreadState } from "@/lib/yougan-chat-api";
import { LANGGRAPH_API_URL } from "@/lib/env";
import type { BriefSuggestions, YouganValues, Work, WorkConversation, ChatMode } from "@/lib/types";
import { useAuthToken } from "@/store/auth";

const STREAM_MODES = ["messages-tuple", "updates", "values"] as const;

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
  });

  const wasLoadingRef = useRef(false);
  const bootstrapAttemptedRef = useRef<string | null>(null);
  const conversationModeRef = useRef<ChatMode | null>(null);
  const [threadSuggestions, setThreadSuggestions] =
    useState<BriefSuggestions | null>(null);

  useEffect(() => {
    const wasLoading = wasLoadingRef.current;
    wasLoadingRef.current = stream.isLoading;

    if (!wasLoading || stream.isLoading) return;

    if (workId && stream.values) {
      onRunComplete?.(workId, stream.values);
    }

    if (!conversationId || !stream.values?.mode) {
      return;
    }

    onModeFromStream?.(conversationId, stream.values.mode);
  }, [
    conversationId,
    onModeFromStream,
    onRunComplete,
    stream.isLoading,
    stream.values,
    workId,
  ]);

  useEffect(() => {
    if (stream.isLoading || !threadId) return;

    let cancelled = false;
    void getYouganThreadState(threadId, defaultHeaders)
      .then((state) => {
        if (cancelled) return;
        const values = state.values as YouganValues | undefined;
        const suggestions = normalizeBriefSuggestions(values?.briefSuggestions);
        setThreadSuggestions(suggestions);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [defaultHeaders, stream.isLoading, threadId, stream.messages.length]);

  const resolvedValues = useMemo(() => {
    const fromStream = normalizeBriefSuggestions(stream.values?.briefSuggestions);
    const suggestions = fromStream ?? threadSuggestions;
    if (suggestions) {
      return {
        ...(stream.values ?? {}),
        briefSuggestions: suggestions,
      } satisfies YouganValues;
    }
    return stream.values ?? null;
  }, [stream.values, threadSuggestions]);

  const bootstrapRecommendations = useCallback(
    async (options?: { force?: boolean }) => {
      if (!work || !conversation || !token) return;
      if (stream.isLoading) return;
      if (stream.messages.length > 0) return;

      if (!options?.force) {
        const existing = normalizeBriefSuggestions(stream.values?.briefSuggestions);
        if (existing ?? threadSuggestions) return;
      }

      setThreadSuggestions(null);

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
          streamMode: [...STREAM_MODES],
        },
      );
    },
    [conversation, modelTemperature, stream, threadSuggestions, token, work],
  );

  useEffect(() => {
    if (!conversation) return;
    const prevMode = conversationModeRef.current;
    conversationModeRef.current = conversation.mode;
    if (
      prevMode !== null &&
      prevMode !== conversation.mode &&
      stream.messages.length === 0 &&
      work &&
      token
    ) {
      bootstrapAttemptedRef.current = conversation.id;
      void bootstrapRecommendations({ force: true }).catch(() => {
        bootstrapAttemptedRef.current = null;
      });
    }
  }, [bootstrapRecommendations, conversation, stream.messages.length, token, work]);

  useEffect(() => {
    if (!conversation?.id || !work || !token) return;
    if (stream.messages.length > 0) {
      bootstrapAttemptedRef.current = null;
      return;
    }
    if (bootstrapAttemptedRef.current === conversation.id) return;
    if (stream.isLoading) return;

    const existing = normalizeBriefSuggestions(stream.values?.briefSuggestions);
    if (existing ?? threadSuggestions) return;

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
    threadSuggestions,
    token,
    work,
  ]);

  const sendMessage = useCallback(
    async (text: string, imageUrls: string[] = []) => {
      const content = buildHumanMessageContent(text, imageUrls);
      const hasText =
        typeof content === "string" ? Boolean(content.trim()) : content.length > 0;
      if (!hasText || !work || !conversation) return;

      setThreadSuggestions(null);

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
          streamMode: [...STREAM_MODES],
        },
      );
    },
    [conversation, modelTemperature, stream, work],
  );

  return {
    stream,
    threadId,
    threadSuggestions,
    resolvedValues,
    sendMessage,
    bootstrapRecommendations,
    canChat: Boolean(work && conversation && token),
  };
}

export type YouganStream = ReturnType<typeof useYouganStream>;
