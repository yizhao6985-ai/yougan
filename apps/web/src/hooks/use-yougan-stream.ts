import { useCallback, useMemo, useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import type { Message } from "@langchain/langgraph-sdk";
import { useStream } from "@langchain/langgraph-sdk/react";

import { queryKeys } from "@/hooks/queries/keys";
import { useOpeningBootstrapQuery } from "@/hooks/queries/opening-bootstrap";
import {
  applyGraphUpdatesToValues,
  buildSubmitHumanMessage,
} from "@/lib/message-utils";
import { YOUGAN_ASSISTANT_ID } from "@/lib/yougan-chat-api";
import { LANGGRAPH_API_URL } from "@/lib/env";
import {
  buildTurnFinalizePatch,
  getActiveLangGraphRunId,
  TURN_EPHEMERAL_RESET,
} from "@/lib/turn-lifecycle";
import type {
  YouganValues,
  YouganSubmitInput,
  Work,
  WorkConversation,
} from "@/lib/types";
import { useAuthToken } from "@/store/auth";

/** 消息 chunk 走 messages-tuple；其余 state（profile、turnQueue 等）走 updates 合并，避免 values 整表覆盖。 */
const LANGGRAPH_STREAM_MODE = ["updates", "messages-tuple"] as const;

const SUBMIT_OPTIONS = {
  streamMode: [...LANGGRAPH_STREAM_MODE],
  multitaskStrategy: "interrupt" as const,
};

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
    ...TURN_EPHEMERAL_RESET,
    ...(messages ? { messages } : {}),
    workId: work.id,
    workTitle: work.title,
    conversationTitle: conversation.title,
    profile: work.profile,
    references: work.references,
    productionPlan: work.productionPlan,
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
  const queryClient = useQueryClient();
  const threadId = conversation?.threadId ?? null;
  const workId = work?.id ?? null;
  const conversationId = conversation?.id ?? null;
  const token = useAuthToken();

  const onRunCompleteRef = useRef(onRunComplete);
  onRunCompleteRef.current = onRunComplete;

  const cancelInFlightRef = useRef<Promise<void> | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  /** cancel finalize 后合并到 stream.values，直至下次 submit 或 thread 重载 */
  const [postCancelValues, setPostCancelValues] =
    useState<Partial<YouganValues> | null>(null);

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
      if (values.turn?.cancelled === true || values.turn?.committed !== true)
        return;
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

  const awaitCancelIfInFlight = useCallback(async () => {
    if (cancelInFlightRef.current) {
      await cancelInFlightRef.current;
    }
  }, []);

  const submitOpeningBootstrap = useCallback(async () => {
    if (!work || !conversation || !token) return;
    if (stream.messages.length > 0) return;

    await awaitCancelIfInFlight();
    setPostCancelValues(null);

    await stream.submit(
      buildStreamSubmitInput(work, conversation, modelTemperature),
      SUBMIT_OPTIONS,
    );
  }, [
    awaitCancelIfInFlight,
    conversation,
    modelTemperature,
    stream,
    token,
    work,
  ]);

  const openingBootstrapQuery = useOpeningBootstrapQuery({
    work,
    conversation,
    token,
    messageCount: stream.messages.length,
    isThreadLoading: stream.isThreadLoading,
    isCancelling,
    submitOpeningBootstrap,
  });

  const cancelActiveTurn = useCallback(async () => {
    if (!stream.isLoading || isCancelling) return;

    if (cancelInFlightRef.current) {
      await cancelInFlightRef.current;
      return;
    }

    const run = (async () => {
      setIsCancelling(true);

      const cancelPatch = buildTurnFinalizePatch(
        stream.values as YouganValues,
        stream.messages,
      );

      const activeRunId = threadId ? getActiveLangGraphRunId(threadId) : null;

      await stream.stop();

      if (threadId && activeRunId) {
        try {
          await stream.client.runs.cancel(threadId, activeRunId, true);
        } catch (error) {
          console.error("[yougan] cancel run failed", error);
        }
      }

      if (threadId) {
        try {
          await stream.client.threads.updateState(threadId, {
            values: cancelPatch,
          });
        } catch (error) {
          console.error("[yougan] cancel turn updateState failed", error);
        }
      }

      setPostCancelValues(cancelPatch);

      if (workId && conversationId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.works.openingBootstrap(workId, conversationId),
        });
      }
    })();

    cancelInFlightRef.current = run;
    try {
      await run;
    } finally {
      if (cancelInFlightRef.current === run) {
        cancelInFlightRef.current = null;
      }
      setIsCancelling(false);
    }
  }, [
    conversationId,
    isCancelling,
    queryClient,
    stream,
    threadId,
    workId,
  ]);

  const sendMessage = useCallback(
    async (
      text: string,
      attachments: Parameters<typeof buildSubmitHumanMessage>[1] = [],
    ) => {
      const message = buildSubmitHumanMessage(text, attachments);
      const content = message.content;
      const hasText =
        typeof content === "string"
          ? Boolean(content.trim())
          : content.length > 0;
      if (!hasText || !work || !conversation) return;

      await awaitCancelIfInFlight();
      setPostCancelValues(null);

      await stream.submit(
        buildStreamSubmitInput(work, conversation, modelTemperature, [message]),
        SUBMIT_OPTIONS,
      );
    },
    [
      awaitCancelIfInFlight,
      conversation,
      modelTemperature,
      stream,
      work,
    ],
  );

  const canChat = Boolean(work && conversation && token);
  const canSend = canChat && !stream.isLoading && !isCancelling;

  const isBootstrappingOpening =
    Boolean(conversation?.id) &&
    stream.messages.length === 0 &&
    (openingBootstrapQuery.isFetching ||
      openingBootstrapQuery.isPending ||
      stream.isThreadLoading ||
      stream.isLoading ||
      isCancelling);

  const streamWithPostCancel = useMemo(
    () =>
      postCancelValues
        ? {
            ...stream,
            values: {
              ...(stream.values ?? {}),
              ...postCancelValues,
            } as YouganValues,
          }
        : stream,
    [postCancelValues, stream],
  );

  return {
    stream: streamWithPostCancel,
    threadId,
    sendMessage,
    cancelActiveTurn,
    isCancelling,
    canSend,
    isBootstrappingOpening,
    canChat,
  };
}

export type YouganStream = ReturnType<typeof useYouganStream>;
