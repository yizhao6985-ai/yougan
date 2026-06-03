import { useCallback, useEffect, useMemo, useRef } from "react";

import type { Message } from "@langchain/langgraph-sdk";
import { useStream } from "@langchain/langgraph-sdk/react";

import { buildHumanMessageContent } from "@/lib/build-human-message-content";
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
}

export function useYouganStream({
  work,
  conversation,
  modelTemperature,
  onThreadId,
  onRunComplete,
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
    /** 避免 remount / 切 tab 后误 join 未完成的 run */
    reconnectOnMount: false,
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
  const openingBootstrapInFlightRef = useRef(false);

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

  const bootstrapOpeningSuggestions = useCallback(async () => {
    if (!work || !conversation || !token) return;
    if (stream.messages.length > 0) return;

    await stream.submit(
      {
        workId: work.id,
        workTitle: work.title,
        conversationTitle: conversation.title,
        profile: work.profile,
        outline: work.outline,
        plan: work.plan,
        brief: work.brief,
        openingNextStepSuggestions: null,
        turnNextStepSuggestions: null,
        draft: work.draft,
        modelTemperature,
      },
      {
        streamMode: [...LANGGRAPH_STREAM_MODE],
      },
    );
  }, [conversation, modelTemperature, stream, token, work]);

  useEffect(() => {
    if (!conversation?.id || !work || !token) return;
    if (stream.messages.length > 0) return;
    if (stream.isThreadLoading) return;
    if (stream.isLoading || openingBootstrapInFlightRef.current) return;

    openingBootstrapInFlightRef.current = true;
    void bootstrapOpeningSuggestions().finally(() => {
      openingBootstrapInFlightRef.current = false;
    });
  }, [
    bootstrapOpeningSuggestions,
    conversation?.id,
    stream.isLoading,
    stream.isThreadLoading,
    stream.messages.length,
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
          workId: work.id,
          workTitle: work.title,
          conversationTitle: conversation.title,
          profile: work.profile,
          outline: work.outline,
          plan: work.plan,
          brief: work.brief,
          openingNextStepSuggestions: null,
          turnNextStepSuggestions: null,
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

  const isBootstrappingOpening =
    Boolean(conversation?.id) &&
    stream.messages.length === 0 &&
    (stream.isLoading || stream.isThreadLoading);

  return {
    stream,
    threadId,
    sendMessage,
    isBootstrappingOpening,
    canChat: Boolean(work && conversation && token),
  };
}

export type YouganStream = ReturnType<typeof useYouganStream>;
