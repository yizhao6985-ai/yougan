import { useCallback, useMemo, useRef, useState } from "react";

import type { Message } from "@langchain/langgraph-sdk";
import { useStream } from "@langchain/langgraph-sdk/react";

import { useOpeningBootstrapQuery } from "@/hooks/queries/opening-bootstrap";
import { buildHumanMessageContent } from "@/lib/build-human-message-content";
import { buildTurnCancelPatch } from "@/lib/cancel-turn";
import { applyGraphUpdatesToValues } from "@/lib/message-utils";
import { YOUGAN_ASSISTANT_ID } from "@/lib/yougan-chat-api";
import { LANGGRAPH_API_URL } from "@/lib/env";
import type { YouganValues, YouganSubmitInput, Work, WorkConversation } from "@/lib/types";
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

function buildStreamSubmitInput(
  work: Work,
  conversation: WorkConversation,
  modelTemperature: number,
  messages?: Message[],
): YouganSubmitInput & { messages?: Message[] } {
  return {
    ...(messages ? { messages } : {}),
    workId: work.id,
    workTitle: work.title,
    conversationTitle: conversation.title,
    profile: work.profile,
    productionPlan: work.productionPlan,
    nextStepSuggestions: null,
    preview: work.preview,
    modelTemperature,
  };
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

  const onRunCompleteRef = useRef(onRunComplete);
  onRunCompleteRef.current = onRunComplete;

  const [valuesOverlay, setValuesOverlay] = useState<Partial<YouganValues> | null>(
    null,
  );

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
    onFinish: (state) => {
      if (!workId) return;
      const values =
        "values" in state && state.values
          ? (state.values as YouganValues)
          : (state as unknown as YouganValues);
      if (values.turnCancelled === true || values.turnCommitted !== true) return;
      onRunCompleteRef.current?.(workId, values);
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

  const submitOpeningBootstrap = useCallback(async () => {
    if (!work || !conversation || !token) return;
    if (stream.messages.length > 0) return;

    await stream.submit(
      buildStreamSubmitInput(work, conversation, modelTemperature),
      {
        streamMode: [...LANGGRAPH_STREAM_MODE],
      },
    );
  }, [conversation, modelTemperature, stream, token, work]);

  const openingBootstrapQuery = useOpeningBootstrapQuery({
    work,
    conversation,
    token,
    messageCount: stream.messages.length,
    isThreadLoading: stream.isThreadLoading,
    submitOpeningBootstrap,
  });

  const cancelActiveTurn = useCallback(async () => {
    if (!stream.isLoading) return;

    const cancelPatch = buildTurnCancelPatch(
      { ...stream.values, ...valuesOverlay } as YouganValues,
      stream.messages,
    );

    await stream.stop();

    setValuesOverlay(cancelPatch);

    if (threadId) {
      try {
        await stream.client.threads.updateState(threadId, {
          values: cancelPatch,
        });
      } catch (error) {
        console.error("[yougan] cancel turn updateState failed", error);
      }
    }
  }, [stream, threadId, valuesOverlay]);

  const sendMessage = useCallback(
    async (text: string, imageUrls: string[] = []) => {
      const content = buildHumanMessageContent(text, imageUrls);
      const hasText =
        typeof content === "string" ? Boolean(content.trim()) : content.length > 0;
      if (!hasText || !work || !conversation) return;

      setValuesOverlay(null);

      await stream.submit(
        buildStreamSubmitInput(work, conversation, modelTemperature, [
          { type: "human" as const, content },
        ]),
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
    (openingBootstrapQuery.isFetching ||
      openingBootstrapQuery.isPending ||
      stream.isThreadLoading ||
      stream.isLoading);

  const streamWithOverlay = useMemo(
    () => ({
      ...stream,
      values: {
        ...(stream.values ?? {}),
        ...(valuesOverlay ?? {}),
      } as YouganValues,
    }),
    [stream, valuesOverlay],
  );

  return {
    stream: streamWithOverlay,
    threadId,
    sendMessage,
    cancelActiveTurn,
    isBootstrappingOpening,
    canChat: Boolean(work && conversation && token),
  };
}

export type YouganStream = ReturnType<typeof useYouganStream>;
