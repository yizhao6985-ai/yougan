import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  clearActiveLangGraphRunId,
  findResumableLangGraphRunId,
  getActiveLangGraphRunId,
  isActiveLangGraphRunStatus,
  isTurnInFlight,
  TURN_EPHEMERAL_RESET,
} from "@/lib/turn-lifecycle";
import type {
  YouganValues,
  YouganSubmitInput,
  Work,
  WorkConversation,
  RunProgress,
} from "@/lib/types";
import {
  isRunProgressCustomPayload,
  pickRunProgress,
} from "@/lib/run-progress";
import { useAuthToken } from "@/store/auth";

/** 消息 chunk 走 messages-tuple；其余 state（profile、turnQueue 等）走 updates 合并，避免 values 整表覆盖。 */
const LANGGRAPH_STREAM_MODE = ["updates", "messages-tuple"] as const;

const SUBMIT_OPTIONS = {
  streamMode: [...LANGGRAPH_STREAM_MODE],
  multitaskStrategy: "interrupt" as const,
  /** 连接意外断开时服务端继续执行；用户取消仍走 cancelActiveTurn 的 runs.cancel */
  onDisconnect: "continue" as const,
  /** 保留 SSE 事件缓冲，供 joinStream 断点续传 */
  streamResumable: true as const,
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
    production: work.production,
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
  const [liveRunProgress, setLiveRunProgress] = useState<RunProgress | null>(
    null,
  );
  const [isJoiningRun, setIsJoiningRun] = useState(false);
  const reconnectAttemptRef = useRef<string | null>(null);

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
    /** mount 时从 sessionStorage join 未完成 run；配合下方 runs.list 兜底 */
    reconnectOnMount: true,
    /** rejoin 完成后 onFinish 需拉取 thread head state */
    fetchStateHistory: true,
    throttle: false,
    onThreadId: (id) => {
      if (conversationId) onThreadId?.(conversationId, id);
    },
    onError: (error) => {
      console.error("[yougan] stream error", error);
      if (threadId) {
        clearActiveLangGraphRunId(threadId);
        reconnectAttemptRef.current = null;
      }
    },
    onFinish: (state) => {
      setLiveRunProgress(null);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.subscription.all,
      });
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

      for (const raw of Object.values(update as Record<string, unknown>)) {
        if (!raw || typeof raw !== "object" || !("runProgress" in raw)) continue;
        const progress = (raw as { runProgress?: RunProgress | null }).runProgress;
        if (progress && typeof progress === "object" && "label" in progress) {
          setLiveRunProgress(progress);
        }
      }
    },
    onCustomEvent: (data) => {
      if (isRunProgressCustomPayload(data)) {
        setLiveRunProgress(data.progress);
      }
    },
  });

  /** 清理 sessionStorage 中已结束的 run，避免 SDK 误 join */
  useEffect(() => {
    if (!threadId || stream.isThreadLoading) return;
    const storedRunId = getActiveLangGraphRunId(threadId);
    if (!storedRunId) return;

    let cancelled = false;
    void (async () => {
      try {
        const run = await stream.client.runs.get(threadId, storedRunId);
        if (cancelled || isActiveLangGraphRunStatus(run.status)) return;
      } catch {
        if (cancelled) return;
      }
      clearActiveLangGraphRunId(threadId);
      reconnectAttemptRef.current = null;
    })();

    return () => {
      cancelled = true;
    };
  }, [stream.client, stream.isThreadLoading, threadId]);

  /** sessionStorage 无记录时，用 runs.list 发现并 join 仍在执行的 run */
  useEffect(() => {
    if (!threadId || stream.isThreadLoading || isCancelling) return;
    if (stream.isLoading || isJoiningRun) return;
    if (getActiveLangGraphRunId(threadId)) return;

    const attemptKey = threadId;
    if (reconnectAttemptRef.current === attemptKey) return;

    let cancelled = false;

    void (async () => {
      const runId = await findResumableLangGraphRunId(stream.client, threadId);
      if (cancelled || !runId || stream.isLoading) {
        reconnectAttemptRef.current = attemptKey;
        return;
      }

      setIsJoiningRun(true);
      try {
        await stream.joinStream(runId, "-1", {
          streamMode: [...LANGGRAPH_STREAM_MODE],
        });
      } catch (error) {
        console.error("[yougan] join stream failed", error);
        clearActiveLangGraphRunId(threadId);
      } finally {
        if (!cancelled) setIsJoiningRun(false);
        reconnectAttemptRef.current = attemptKey;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isCancelling,
    isJoiningRun,
    stream,
    threadId,
  ]);

  useEffect(() => {
    reconnectAttemptRef.current = null;
  }, [threadId]);

  const streamValues = stream.values as YouganValues | undefined;
  const hasActiveRun =
    stream.isLoading ||
    isJoiningRun ||
    Boolean(threadId && getActiveLangGraphRunId(threadId)) ||
    isTurnInFlight(streamValues);

  const isStreamBusy = stream.isLoading || isJoiningRun;

  const awaitCancelIfInFlight = useCallback(async () => {
    if (cancelInFlightRef.current) {
      await cancelInFlightRef.current;
    }
  }, []);

  const submitOpeningBootstrap = useCallback(async () => {
    if (!work || !conversation || !token) return;
    if (stream.messages.length > 0) return;
    if (
      stream.isLoading ||
      isJoiningRun ||
      isTurnInFlight(stream.values as YouganValues | undefined) ||
      (threadId && getActiveLangGraphRunId(threadId))
    ) {
      return;
    }

    await awaitCancelIfInFlight();
    setPostCancelValues(null);
    setLiveRunProgress(null);

    await stream.submit(
      buildStreamSubmitInput(work, conversation, modelTemperature),
      SUBMIT_OPTIONS,
    );
  }, [
    awaitCancelIfInFlight,
    conversation,
    isJoiningRun,
    modelTemperature,
    stream,
    threadId,
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
    hasActiveRun,
    submitOpeningBootstrap,
  });

  const cancelActiveTurn = useCallback(async () => {
    if (isCancelling) return;
    const values = stream.values as YouganValues | undefined;
    const canCancel =
      isStreamBusy ||
      Boolean(threadId && getActiveLangGraphRunId(threadId)) ||
      isTurnInFlight(values);
    if (!canCancel) return;

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

      const activeRunId =
        threadId &&
        (getActiveLangGraphRunId(threadId) ??
          (await findResumableLangGraphRunId(stream.client, threadId)));

      await stream.stop();

      if (threadId && activeRunId) {
        try {
          await stream.client.runs.cancel(threadId, activeRunId, true);
        } catch (error) {
          console.error("[yougan] cancel run failed", error);
        }
      }

      if (threadId) clearActiveLangGraphRunId(threadId);

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
      setLiveRunProgress(null);

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
    isStreamBusy,
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
      setLiveRunProgress(null);

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
  const canSend = canChat && !hasActiveRun && !isCancelling;

  const isBootstrappingOpening =
    Boolean(conversation?.id) &&
    stream.messages.length === 0 &&
    !hasActiveRun &&
    (openingBootstrapQuery.isFetching ||
      openingBootstrapQuery.isPending ||
      stream.isThreadLoading ||
      isCancelling);

  const streamWithPostCancel = useMemo(
    () => {
      const base =
        postCancelValues
          ? {
              ...stream,
              values: {
                ...(stream.values ?? {}),
                ...postCancelValues,
              } as YouganValues,
            }
          : stream;
      return isStreamBusy ? { ...base, isLoading: true } : base;
    },
    [isStreamBusy, postCancelValues, stream],
  );

  const runProgress = useMemo(
    () =>
      pickRunProgress(
        liveRunProgress,
        (streamWithPostCancel.values as YouganValues | undefined)?.runProgress,
      ),
    [liveRunProgress, streamWithPostCancel.values],
  );

  return {
    stream: streamWithPostCancel,
    runProgress,
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
