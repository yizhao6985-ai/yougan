import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useStream } from "@langchain/langgraph-sdk/react";

import { buildHumanMessageContent } from "@/lib/build-human-message-content";
import { normalizeInspirationSuggestions } from "@/lib/inspiration-ui-spec";
import { YOUGAN_ASSISTANT_ID, getYouganThreadState } from "@/lib/yougan-chat-api";
import { LANGGRAPH_API_URL } from "@/lib/env";
import type { InspirationSuggestions } from "@/lib/types";
import type { YouganValues, Work, WorkConversation } from "@/lib/types";
import { useAuthToken } from "@/store/auth";

const STREAM_MODES = ["messages-tuple", "updates", "values"] as const;

interface UseYouganStreamOptions {
  work: Work | null;
  conversation: WorkConversation | null;
  modelTemperature: number;
  onThreadId?: (conversationId: string, threadId: string | null) => void;
  onValuesChange?: (workId: string, values: YouganValues) => void;
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
  onValuesChange,
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

  const lastSyncedRef = useRef<string>("");
  const wasLoadingRef = useRef(false);
  const [threadSuggestions, setThreadSuggestions] =
    useState<InspirationSuggestions | null>(null);

  useEffect(() => {
    if (!workId || !stream.values) return;
    const snapshot = JSON.stringify(stream.values);
    if (snapshot === lastSyncedRef.current) return;
    lastSyncedRef.current = snapshot;
    onValuesChange?.(workId, stream.values);
  }, [onValuesChange, stream.values, workId]);

  useEffect(() => {
    const wasLoading = wasLoadingRef.current;
    wasLoadingRef.current = stream.isLoading;

    if (
      !conversationId ||
      !wasLoading ||
      stream.isLoading ||
      !stream.values?.mode
    ) {
      return;
    }

    onModeFromStream?.(conversationId, stream.values.mode);
  }, [
    conversationId,
    onModeFromStream,
    stream.isLoading,
    stream.values?.mode,
  ]);

  useEffect(() => {
    if (stream.isLoading || !threadId) return;

    let cancelled = false;
    void getYouganThreadState(threadId, defaultHeaders)
      .then((state) => {
        if (cancelled) return;
        const values = state.values as YouganValues | undefined;
        const suggestions = normalizeInspirationSuggestions(
          values?.inspirationSuggestions ?? values?.inspirationChoices,
        );
        setThreadSuggestions(suggestions);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [defaultHeaders, stream.isLoading, threadId, stream.messages.length]);

  const resolvedValues = useMemo(() => {
    const fromStream = normalizeInspirationSuggestions(
      stream.values?.inspirationSuggestions ?? stream.values?.inspirationChoices,
    );
    const suggestions = fromStream ?? threadSuggestions;
    if (suggestions) {
      return {
        ...(stream.values ?? {}),
        inspirationSuggestions: suggestions,
      } satisfies YouganValues;
    }
    return stream.values ?? null;
  }, [stream.values, threadSuggestions]);

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
          profile: work.profile,
          plan: work.outline,
          inspiration: work.inspiration,
          inspirationSuggestions: null,
          creation: work.creation,
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
    canChat: Boolean(work && conversation && token),
  };
}

export type YouganStream = ReturnType<typeof useYouganStream>;
