import { useBoolean, useLatest, useMemoizedFn } from "ahooks";
import { useEffect, useMemo, useRef, useState } from "react";

import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { Client, Message } from "@langchain/langgraph-sdk";
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
  isLangGraphThreadMissingError,
  isProductionTurnActive,
  isReviseTurnActive,
  isTurnInFlight,
  TURN_EPHEMERAL_RESET,
} from "@/lib/turn-lifecycle";
import type {
  YouganValues,
  YouganSubmitInput,
  Work,
  WorkConversation,
  WorkProfile,
} from "@/lib/types";
import {
  fallbackConversationTitleFromText,
  isDefaultConversationTitle,
  type ProductionConfirmDecision,
  type ProductionConfirmInterruptValue,
  type ReviseConfirmDecision,
  type ReviseConfirmInterruptValue,
} from "@yougan/domain";
import {
  aiUsageFromThreadState,
  isAiUsageCustomPayload,
  syncSubscriptionCacheFromAiUsage,
} from "@/lib/ai-usage";
import {
  resolveProductionConfirmInterrupt,
} from "@/lib/production-confirm-interrupt";
import {
  isSameReviseConfirmInterrupt,
  resolveReviseConfirmInterrupt,
} from "@/lib/revise-confirm-interrupt";
import { hasTurnConfirmInterrupt } from "@/lib/turn-confirm-interrupt";
import {
  buildReadSyncPatchFromThreadHead,
  fetchThreadHead,
  isSameProductionConfirmInterrupt,
  needsAbnormalReconcile,
  resolveThreadRunPhase,
  shouldWriteStaleTurnRepair,
} from "@/lib/thread-run-coordination";
import { useAuthToken } from "@/store/auth";
import { patchConversationsCache } from "@/hooks/queries/conversations";
import type { ConversationSuggestionsCache } from "@/hooks/use-conversation-suggestions-cache";
import type { NextStepSuggestions } from "@/lib/types";

/**
 * Studio 聊天与 LangGraph thread 之间的核心数据层。
 *
 * ## 背景
 *
 * LangGraph SDK 的 `useStream` 负责 SSE 订阅与 checkpoint 增量，但 Yougan 还有额外需求：
 * - 刷新/断线后恢复未完成 run（joinStream）
 * - production 制作前 HITL 确认（interrupt + resume）
 * - 用户取消回合（runs.cancel + updateState 写 finalize patch）
 * - cancel / repair / 物化后本地 patch 与 stream.values 的合并
 * - opening 空对话自动 bootstrap
 *
 * 本 hook 在 SDK 之上封装上述逻辑，对外提供统一的 stream 对象与动作 API。
 *
 * ## 数据流
 *
 * ```
 * 用户 send / opening bootstrap
 *   → stream.submit(TURN_EPHEMERAL_RESET + work 快照)
 *   → SSE updates / messages-tuple / custom
 *   → onUpdateEvent 合并 checkpoint → stream.values
 *   → turn.committed 时 onRunComplete
 *
 * 刷新 / 切对话
 *   → resolveThreadRunPhase (runs.list)
 *   → running: joinStream | interrupted: 恢复 HITL | idle: getState 对齐/repair
 *
 * 用户 cancel
 *   → stream.stop + runs.cancel + updateState(cancelPatch)
 *   → postCancelValues 覆盖 UI，直至下次 submit
 * ```
 *
 * ## 关键本地状态
 *
 * - `postCancelValues`：cancel/repair/materialize 写入的 values 增量，SDK 不会自动 refetch
 * - `persistedProductionConfirmInterrupt`：bootstrap 时从 getState 恢复的 HITL，弥补 stream.interrupt 空窗
 * - `runDiscoverySettled`：bootstrap 完成前，避免把 checkpoint 脏态误判为可发送
 *
 * 并发与对账细节见 `@/lib/thread-run-coordination`、`@/lib/turn-lifecycle`。
 */

/** LangGraph SSE 订阅模式：updates 合并 state；messages-tuple 流式消息；custom 为服务端心跳 */
const LANGGRAPH_STREAM_MODE = ["updates", "messages-tuple", "custom"] as const;

/** 用户主动发消息 / opening bootstrap 的 submit 选项 */
const SUBMIT_OPTIONS = {
  streamMode: [...LANGGRAPH_STREAM_MODE],
  /** 新 submit 会 interrupt 同 thread 上仍在跑的 run（与 cancel 路径不同） */
  multitaskStrategy: "interrupt" as const,
  /** 连接意外断开时服务端继续执行；用户主动取消走 runs.cancel + updateState */
  onDisconnect: "continue" as const,
  /** 保留 SSE 事件缓冲，供 joinStream(runId, "-1") 从断点续传 */
  streamResumable: true as const,
};

/**
 * HITL interrupt 的 resume 专用选项。
 * 不加 multitaskStrategy: "interrupt"——resume 是对 checkpoint 上 HITL 的恢复，interrupt 策略会冲突。
 */
const RESUME_TURN_CONFIRM_OPTIONS = {
  streamMode: [...LANGGRAPH_STREAM_MODE],
  onDisconnect: "continue" as const,
  streamResumable: true as const,
};

interface UseYouganStreamOptions {
  work: Work | null;
  conversation: WorkConversation | null;
  modelTemperature: number;
  /** 按对话缓存 nextStepSuggestions，切换回来时复用、避免重复 bootstrap */
  suggestionsCache?: ConversationSuggestionsCache;
  /** conversation 首次拿到 LangGraph threadId 时回写 DB（SDK onThreadId 回调） */
  onThreadId?: (conversationId: string, threadId: string | null) => void;
  /** 回合 committed 后触发（刷新作品物化列、侧边栏等） */
  onRunComplete?: (workId: string, values: YouganValues) => void;
}

function hasNextStepSuggestions(
  value: NextStepSuggestions | null | undefined,
): boolean {
  return (value?.suggestions?.length ?? 0) > 0;
}

/**
 * 构造 stream.submit 的 input：每轮 submit 重置 turn 运行时字段，并带上当前 work 快照。
 * Agent 图据此初始化 profile/references/production，无需客户端再拉一次 work API。
 */
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
    preview: work.preview,
    revision: work.revision,
    production: work.production,
    modelTemperature,
  };
}

/**
 * joinStream 结束后补拉 thread head。
 *
 * 场景：用户刷新页面后 join 旧 run，SSE 可能已错过 finalize 事件（turn.committed、aiUsage）。
 * 正常 submit 路径在 onUpdateEvent 里已处理 committed，不需要此函数。
 *
 * 仅在 pendingRejoinSyncRef 为 true 且 stream 从 busy→idle 时调用一次。
 */
async function syncThreadHeadAfterRejoin(
  client: Client,
  queryClient: QueryClient,
  threadId: string,
  workId: string | null,
  onRunComplete: ((workId: string, values: YouganValues) => void) | undefined,
) {
  const state = await client.threads.getState(threadId);
  const values = (state.values ?? {}) as YouganValues;
  syncSubscriptionCacheFromAiUsage(
    queryClient,
    aiUsageFromThreadState(state) ?? values.aiUsage,
  );
  if (!workId) return;
  /** 仅 committed 且未 cancel 的回合才通知上层（物化作品等） */
  if (values.turn?.cancelled === true || values.turn?.committed !== true)
    return;
  onRunComplete?.(workId, values);
}

/**
 * 为 idle/abnormal reconcile 生成去重 key 的 turn 指纹。
 *
 * TurnRuntime 没有 turn id；同一 thread 上若 activeKind + queue 不变，
 * 说明是同一悬空回合，不必重复 reconcile / repair。
 */
function turnReconcileFingerprint(
  turn: YouganValues["turn"] | undefined,
): string {
  if (!turn) return "none";
  const active = turn.activeKind ?? "none";
  const queue = turn.queue.length > 0 ? turn.queue.join(",") : "empty";
  return `${active}:${queue}`;
}

/**
 * Studio 聊天 stream hook：绑定当前 work + conversation，管理 LangGraph thread 全生命周期。
 *
 * 消费方：`YouganStreamProvider` → `useYouganStreamContext()`，供聊天区、composer、侧边栏等使用。
 */
export function useYouganStream({
  work,
  conversation,
  modelTemperature,
  suggestionsCache,
  onThreadId,
  onRunComplete,
}: UseYouganStreamOptions) {
  const queryClient = useQueryClient();
  const threadId = conversation?.threadId ?? null;
  const workId = work?.id ?? null;
  const conversationId = conversation?.id ?? null;
  const token = useAuthToken();

  /** 避免 effect / 异步回调闭包捕获过期的 onRunComplete / onThreadId */
  const onRunCompleteRef = useLatest(onRunComplete);
  const onThreadIdRef = useLatest(onThreadId);

  // --- 本地状态：cancel / join / repair / interrupt 持久化 / 运行进度 ---

  /** 串行化 cancel：sendMessage 等会先 await，避免 cancel 与 submit 交错 */
  const cancelInFlightRef = useRef<Promise<void> | null>(null);
  const [
    isCancelling,
    { setTrue: startCancelling, setFalse: finishCancelling },
  ] = useBoolean(false);
  /** HITL resume 提交中（production 确认 accept/decline） */
  const [
    isResumingInterrupt,
    { setTrue: startResumingInterrupt, setFalse: finishResumingInterrupt },
  ] = useBoolean(false);
  /**
   * cancel / repair / materialize 后写入的 values 增量。
   * SDK 在 fetchStateHistory:false 下不会自动 refetch，需本地合并到 UI。
   * 下次 submit 或切换 thread 时清空。
   */
  const [postCancelValues, setPostCancelValues] =
    useState<Partial<YouganValues> | null>(null);
  /** joinStream 进行中（refresh 后恢复 run） */
  const [
    isJoiningRun,
    { setTrue: startJoiningRun, setFalse: finishJoiningRun },
  ] = useBoolean(false);
  /** stale turn repair：idle 且无 run 但 checkpoint 仍 in-flight 时写 finalize patch */
  const [
    isRepairingStaleTurn,
    { setTrue: startRepairingStaleTurn, setFalse: finishRepairingStaleTurn },
  ] = useBoolean(false);
  /**
   * bootstrap 时从 getState 恢复的 production 确认 interrupt。
   * stream.interrupt 在 mount 初期可能为空，persist 避免 UI 闪一下又消失。
   */
  const [
    persistedProductionConfirmInterrupt,
    setPersistedProductionConfirmInterrupt,
  ] = useState<ProductionConfirmInterruptValue | null>(null);
  const [
    persistedReviseConfirmInterrupt,
    setPersistedReviseConfirmInterrupt,
  ] = useState<ReviseConfirmInterruptValue | null>(null);
  /**
   * resolveThreadRunPhase 已完成（bootstrap effect 跑完）。
   * false 时若 checkpoint 仍 in-flight，hasActiveRun 为 true，禁止发送——避免脏态误操作。
   */
  const [runDiscoverySettled, setRunDiscoverySettled] = useState(false);
  /** 每个 threadId 只 bootstrap 一次（reconnectAttemptRef === threadId 则跳过） */
  const reconnectAttemptRef = useRef<string | null>(null);
  /** 同一时刻只允许一个 stale turn repair */
  const repairInFlightRef = useRef<Promise<void> | null>(null);
  /** 记录最近一次 idle/abnormal reconcile 的 fingerprint，避免 effect 重复触发 */
  const idleReconcileKeyRef = useRef<string | null>(null);
  /** 追踪 stream 从 busy→idle，用于触发 abnormal reconcile（与 wasStreamBusyRef 分工） */
  const wasStreamEndedBusyRef = useRef(false);
  /**
   * join 结束后需补一次 getState（syncThreadHeadAfterRejoin）。
   * 由 joinResumableRunStream 置 true，rejoin sync effect 消费后置 false。
   */
  const pendingRejoinSyncRef = useRef(false);
  /** 追踪 rejoin sync effect：stream 从 busy→idle 时触发 head 补同步 */
  const wasStreamBusyRef = useRef(false);
  /** send/cancel 后暂停 suggestions 写入 cache，避免旧开屏建议被 effect 写回 */
  const suppressSuggestionsCacheRef = useRef(false);

  // --- Thread run 协调（join / bootstrap / reconcile）---

  /** 写入 persisted interrupt；内容相同时不 setState，减少重渲染 */
  const applyPersistedProductionConfirmInterrupt = useMemoizedFn(
    (interrupt: ProductionConfirmInterruptValue | null | undefined) => {
      if (!interrupt) return;
      setPersistedProductionConfirmInterrupt((prev) =>
        isSameProductionConfirmInterrupt(prev, interrupt) ? prev : interrupt,
      );
    },
  );

  const applyPersistedReviseConfirmInterrupt = useMemoizedFn(
    (interrupt: ReviseConfirmInterruptValue | null | undefined) => {
      if (!interrupt) return;
      setPersistedReviseConfirmInterrupt((prev) =>
        isSameReviseConfirmInterrupt(prev, interrupt) ? prev : interrupt,
      );
    },
  );

  /**
   * 订阅服务端仍在执行的 run（refresh / abnormal reconcile 共用）。
   * "-1" 表示从 SDK 缓冲的 SSE 断点续传；失败时清 sessionStorage 中的 run id。
   */
  const joinResumableRunStream = useMemoizedFn(async (runId: string) => {
    /** join 期间可能漏 finalize；busy→idle 后由 syncThreadHeadAfterRejoin 补 aiUsage / onRunComplete */
    pendingRejoinSyncRef.current = true;
    startJoiningRun();
    try {
      await stream.joinStream(runId, "-1", {
        streamMode: [...LANGGRAPH_STREAM_MODE],
      });
    } catch (error) {
      if (isLangGraphThreadMissingError(error)) {
        console.warn(
          "[yougan] stale thread id during join, clearing",
          threadId,
        );
        if (conversationId) {
          void onThreadIdRef.current?.(conversationId, null);
        }
      } else {
        console.error("[yougan] join stream failed", error);
      }
      clearActiveLangGraphRunId(threadId!);
    } finally {
      finishJoiningRun();
    }
  });

  /**
   * thread 处于 idle（无 running/interrupted run）时，根据 getState 结果对齐前端。
   *
   * 分支：
   * 1. head 已 committed/cancelled → 只读 patch 到 postCancelValues（不写 checkpoint）
   * 2. head 仍 in-flight 且允许 repair → updateState 写 finalize patch（修脏 checkpoint）
   * 3. 否则仅记录 reconcileKey，跳过后续重复 reconcile
   *
   * @param reconcileKey 非 null 时写入 idleReconcileKeyRef，供 abnormal reconcile 去重
   * @param headState  bootstrap 已拉过 state 时可传入，避免重复 getState
   */
  const applyIdleHeadOutcome = useMemoizedFn(
    async (
      headValues: YouganValues,
      messages: Message[],
      reconcileKey: string | null,
      headState?: Awaited<ReturnType<typeof fetchThreadHead>>["state"],
    ) => {
      if (!threadId) return;

      /** 服务端回合已正常结束，只需把 head 同步到 UI，不 mutate checkpoint */
      const readSyncPatch = buildReadSyncPatchFromThreadHead(headValues);
      if (readSyncPatch) {
        const state =
          headState ?? (await fetchThreadHead(stream.client, threadId)).state;
        const aiUsage = aiUsageFromThreadState(state);
        syncSubscriptionCacheFromAiUsage(
          queryClient,
          aiUsage ?? headValues.aiUsage,
        );
        setPostCancelValues((prev) => ({
          ...(prev ?? {}),
          ...readSyncPatch,
          ...(aiUsage ? { aiUsage } : {}),
        }));
        if (reconcileKey) idleReconcileKeyRef.current = reconcileKey;
        return;
      }

      /** production 保护回合、或 head 并非 stale in-flight → 不写 repair */
      if (!shouldWriteStaleTurnRepair({ kind: "idle" }, headValues)) {
        if (reconcileKey) idleReconcileKeyRef.current = reconcileKey;
        return;
      }

      /** 已有 repair 在进行，等待完成即可 */
      if (repairInFlightRef.current) {
        await repairInFlightRef.current;
        if (reconcileKey) idleReconcileKeyRef.current = reconcileKey;
        return;
      }

      const repair = (async () => {
        startRepairingStaleTurn();
        const repairPatch = buildTurnFinalizePatch(headValues, messages);
        try {
          const nextState = await stream.client.threads.updateState(threadId, {
            values: repairPatch,
          });
          const aiUsage = aiUsageFromThreadState(nextState);
          syncSubscriptionCacheFromAiUsage(queryClient, aiUsage);
          setPostCancelValues({
            ...repairPatch,
            ...(aiUsage ? { aiUsage } : {}),
          });
        } catch (error) {
          console.error("[yougan] repair stale turn failed", error);
        } finally {
          finishRepairingStaleTurn();
        }
      })();

      repairInFlightRef.current = repair;
      try {
        await repair;
      } finally {
        if (repairInFlightRef.current === repair) {
          repairInFlightRef.current = null;
        }
        if (reconcileKey) idleReconcileKeyRef.current = reconcileKey;
      }
    },
  );

  /** LangGraph API 鉴权与 tracing：work / conversation 写入 header 供 proxy 计费与日志 */
  const defaultHeaders = useMemo(
    () => ({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(workId ? { "X-Work-Id": workId } : {}),
      ...(conversationId ? { "X-Conversation-Id": conversationId } : {}),
    }),
    [token, workId, conversationId],
  );

  // --- LangGraph useStream：SSE 订阅与 checkpoint 增量合并 ---

  const stream = useStream<YouganValues>({
    apiUrl: LANGGRAPH_API_URL,
    assistantId: YOUGAN_ASSISTANT_ID,
    threadId: threadId ?? undefined,
    defaultHeaders,
    /** mount / threadId 变化时：SDK 读 sessionStorage 尝试 joinStream 未完成 run */
    reconnectOnMount: true,
    /**
     * false = 只 getState 拉 thread head，不拉 checkpoint 全量 history。
     * 历史消息靠 messages-tuple 增量；rejoin 漏事件由 pendingRejoinSyncRef + getState 兜底。
     */
    fetchStateHistory: false,
    /** false = 每个 SSE chunk 立即 mutate，避免 throttle 导致 committed 检测延迟 */
    throttle: false,
    onThreadId: (id) => {
      if (conversationId) onThreadId?.(conversationId, id);
    },
    onError: (error) => {
      /** Agent 库重置后 conversation 仍保留旧 threadId → 清本地 run id 并通知上层清 threadId */
      if (isLangGraphThreadMissingError(error)) {
        console.warn("[yougan] stale thread id, clearing", threadId);
        if (threadId) {
          clearActiveLangGraphRunId(threadId);
          reconnectAttemptRef.current = null;
        }
        if (conversationId) {
          void onThreadIdRef.current?.(conversationId, null);
        }
        setRunDiscoverySettled(true);
        return;
      }

      console.error("[yougan] stream error", error);
      if (threadId) {
        clearActiveLangGraphRunId(threadId);
        reconnectAttemptRef.current = null;
      }
      setRunDiscoverySettled(true);
    },
    /**
     * checkpoint 增量合并入口：每个 SSE updates 事件触发一次。
     * - mutate 内用 applyGraphUpdatesToValues 浅合并 turn / profile / runProgress 等 channel
     * - 检测 turn.committed 沿 → onRunComplete
     * - 从 update 子对象提取 aiUsage
     */
    onUpdateEvent: (update, { mutate }) => {
      let committedValues: YouganValues | null = null;

      mutate((prev) => {
        const prevValues = (prev ?? {}) as YouganValues;
        const next = applyGraphUpdatesToValues(
          prevValues as YouganValues & { messages?: Message[] },
          update as Record<string, unknown>,
        );

        /** committed 沿：false→true 且未 cancel，表示本回合 agent 已物化 staging */
        const justCommitted =
          prevValues.turn?.committed !== true &&
          next.turn?.committed === true &&
          next.turn?.cancelled !== true;

        if (workId && justCommitted) {
          committedValues = next;
        }

        return next;
      });

      if (committedValues) {
        onRunCompleteRef.current?.(workId!, committedValues);
      }

      /** updates 可能来自多个 subgraph node，逐 value 扫 aiUsage */
      for (const raw of Object.values(update as Record<string, unknown>)) {
        if (!raw || typeof raw !== "object") continue;
        if ("aiUsage" in raw) {
          syncSubscriptionCacheFromAiUsage(
            queryClient,
            (raw as { aiUsage?: YouganValues["aiUsage"] }).aiUsage,
          );
        }
      }
    },
    onCustomEvent: (data) => {
      if (isAiUsageCustomPayload(data)) {
        syncSubscriptionCacheFromAiUsage(queryClient, data.aiUsage);
      }
    },
  });

  // --- 生命周期 effect：rejoin 补同步 / sessionStorage 清理 / bootstrap / thread 切换重置 ---

  /**
   * threadId 变化时：若 sessionStorage 有 lg:stream:{threadId}，标记 join 后需 head 补同步。
   * SDK reconnectOnMount 也会读同一 key 尝试 join。
   */
  useEffect(() => {
    pendingRejoinSyncRef.current = Boolean(
      threadId && getActiveLangGraphRunId(threadId),
    );
  }, [threadId]);

  /**
   * rejoin 补同步：stream.isLoading || isJoiningRun 从 true→false 且 pendingRejoinSyncRef 为 true。
   * 拉一次 getState 同步 aiUsage，并在 committed 时补调 onRunComplete。
   */
  useEffect(() => {
    const isBusy = stream.isLoading || isJoiningRun;
    const wasBusy = wasStreamBusyRef.current;
    wasStreamBusyRef.current = isBusy;

    if (!threadId || isBusy || !wasBusy || !pendingRejoinSyncRef.current)
      return;
    pendingRejoinSyncRef.current = false;

    void syncThreadHeadAfterRejoin(
      stream.client,
      queryClient,
      threadId,
      workId,
      onRunCompleteRef.current,
    ).catch((error) => {
      console.error("[yougan] rejoin thread head sync failed", error);
    });
  }, [
    stream.isLoading,
    isJoiningRun,
    stream.client,
    queryClient,
    threadId,
    workId,
  ]);

  /**
   * sessionStorage 中 run id 可能过期（run 已 success/error）。
   * 校验 runs.get 状态：非 active 且非 interrupted(HITL) 则清除，防止 SDK 下次 mount 误 join。
   */
  useEffect(() => {
    if (!threadId || stream.isThreadLoading) return;
    const storedRunId = getActiveLangGraphRunId(threadId);
    if (!storedRunId) return;

    let cancelled = false;
    void (async () => {
      try {
        const run = await stream.client.runs.get(threadId, storedRunId);
        if (cancelled || isActiveLangGraphRunStatus(run.status)) return;
        /** interrupted = HITL 等待用户，保留 session 无妨；bootstrap 会走 phase.interrupted */
        if (run.status === "interrupted") {
          clearActiveLangGraphRunId(threadId);
          return;
        }
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

  /**
   * Thread bootstrap（每个 threadId 仅一次）：
   *
   * 1. resolveThreadRunPhase → running | interrupted | idle
   * 2. running 且本地未在 stream → joinResumableRunStream
   * 3. interrupted → 清 sessionStorage，恢复 production 确认 UI
   * 4. idle → fetchThreadHead + applyIdleHeadOutcome（只读对齐或 stale repair）
   *
   * 完成后 setRunDiscoverySettled(true)，解锁 hasActiveRun / canSend 判断。
   */
  useEffect(() => {
    if (!threadId || stream.isThreadLoading || isCancelling) return;
    if (stream.isLoading || isJoiningRun || isRepairingStaleTurn) return;

    const attemptKey = threadId;
    if (reconnectAttemptRef.current === attemptKey) return;

    let cancelled = false;

    void (async () => {
      const phase = await resolveThreadRunPhase(stream.client, threadId);
      if (cancelled) return;

      if (phase.kind === "running" && !stream.isLoading) {
        await joinResumableRunStream(phase.runId);
      } else if (phase.kind === "interrupted") {
        clearActiveLangGraphRunId(threadId);
        applyPersistedProductionConfirmInterrupt(phase.productionConfirm);
        applyPersistedReviseConfirmInterrupt(phase.reviseConfirm);
      } else {
        try {
          const { state, values: headValues } = await fetchThreadHead(
            stream.client,
            threadId,
          );
          if (cancelled) return;

          await applyIdleHeadOutcome(headValues, stream.messages, null, state);
        } catch (error) {
          if (isLangGraphThreadMissingError(error)) {
            console.warn(
              "[yougan] stale thread id during bootstrap, clearing",
              threadId,
            );
            if (conversationId) {
              void onThreadIdRef.current?.(conversationId, null);
            }
          } else {
            console.error("[yougan] thread bootstrap failed", error);
          }
        }
      }

      if (!cancelled) {
        reconnectAttemptRef.current = attemptKey;
        setRunDiscoverySettled(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    applyIdleHeadOutcome,
    applyPersistedProductionConfirmInterrupt,
    applyPersistedReviseConfirmInterrupt,
    conversationId,
    isCancelling,
    isJoiningRun,
    isRepairingStaleTurn,
    joinResumableRunStream,
    stream,
    threadId,
  ]);

  /**
   * 切换 conversation / thread 时重置所有协调状态。
   * runDiscoverySettled：无 threadId 时视为已 settled（新对话尚未创建 thread）。
   */
  useEffect(() => {
    reconnectAttemptRef.current = null;
    pendingRejoinSyncRef.current = false;
    wasStreamBusyRef.current = false;
    finishRepairingStaleTurn();
    repairInFlightRef.current = null;
    idleReconcileKeyRef.current = null;
    wasStreamEndedBusyRef.current = false;
    setPersistedProductionConfirmInterrupt(null);
    setPersistedReviseConfirmInterrupt(null);
    setRunDiscoverySettled(!threadId);
  }, [finishRepairingStaleTurn, threadId]);

  /**
   * UI 实际读取的 checkpoint values = SDK stream.values ⊕ postCancelValues。
   * hasActiveRun、canSend、runProgress 等均基于 mergedStreamValues 而非裸 stream.values。
   */
  const mergedStreamValues = useMemo((): YouganValues | undefined => {
    const base = stream.values as YouganValues | undefined;
    if (!postCancelValues) return base;
    const merged = { ...(base ?? {}), ...postCancelValues } as YouganValues;
    /** stream 已写入本回合新 suggestions 时，不被 postCancel 的 null 覆盖 */
    if (
      postCancelValues.nextStepSuggestions === null &&
      hasNextStepSuggestions(base?.nextStepSuggestions)
    ) {
      merged.nextStepSuggestions = base!.nextStepSuggestions!;
    }
    return merged;
  }, [postCancelValues, stream.values]);

  useEffect(() => {
    if (!stream.isLoading && !isJoiningRun) {
      suppressSuggestionsCacheRef.current = false;
    }
  }, [isJoiningRun, stream.isLoading]);

  useEffect(() => {
    if (!workId || !conversationId || !suggestionsCache) return;
    if (suppressSuggestionsCacheRef.current) return;
    if (stream.isLoading || isJoiningRun || isTurnInFlight(mergedStreamValues)) {
      return;
    }
    const suggestions = mergedStreamValues?.nextStepSuggestions;
    if (!hasNextStepSuggestions(suggestions)) return;
    suggestionsCache.set(workId, conversationId, suggestions);
  }, [
    conversationId,
    isJoiningRun,
    mergedStreamValues,
    mergedStreamValues?.nextStepSuggestions,
    suggestionsCache,
    stream.isLoading,
    workId,
  ]);

  const displayStreamValues = useMemo((): YouganValues | undefined => {
    const cached = suggestionsCache?.get(workId, conversationId) ?? null;
    const canUseCachedOverlay =
      Boolean(cached) &&
      !stream.isLoading &&
      !isJoiningRun &&
      !isTurnInFlight(mergedStreamValues);
    if (!mergedStreamValues) {
      if (!canUseCachedOverlay) return undefined;
      return { nextStepSuggestions: cached! } as YouganValues;
    }
    if (hasNextStepSuggestions(mergedStreamValues.nextStepSuggestions)) {
      return mergedStreamValues;
    }
    if (canUseCachedOverlay) {
      return { ...mergedStreamValues, nextStepSuggestions: cached! };
    }
    return mergedStreamValues;
  }, [
    conversationId,
    isJoiningRun,
    mergedStreamValues,
    stream.isLoading,
    suggestionsCache,
    workId,
  ]);

  /**
   * 异常对账：SSE 已停但 mergedStreamValues 仍显示 in-flight（needsAbnormalReconcile）。
   *
   * 典型场景：网络闪断、tab 后台化、SDK isLoading 变 false 但 agent 仍在跑或 checkpoint 未 finalize。
   * 与 bootstrap 类似走 phase 三分支；reconcileKey 防止同一悬空回合重复执行。
   */
  const reconcileAbnormalThreadOnce = useMemoizedFn(async () => {
    if (!threadId || isCancelling || stream.isLoading || isJoiningRun) return;
    if (stream.isThreadLoading || isResumingInterrupt || isRepairingStaleTurn) {
      return;
    }
    if (
      hasTurnConfirmInterrupt(
        stream.interrupt,
        persistedProductionConfirmInterrupt,
        persistedReviseConfirmInterrupt,
      )
    ) {
      return;
    }
    if (!needsAbnormalReconcile(mergedStreamValues)) return;

    const reconcileKey = `${threadId}:abnormal:${turnReconcileFingerprint(mergedStreamValues?.turn)}`;
    if (idleReconcileKeyRef.current === reconcileKey) return;

    const phase = await resolveThreadRunPhase(stream.client, threadId);
    if (phase.kind === "running") {
      idleReconcileKeyRef.current = reconcileKey;
      await joinResumableRunStream(phase.runId);
      return;
    }
    if (phase.kind === "interrupted") {
      clearActiveLangGraphRunId(threadId);
      applyPersistedProductionConfirmInterrupt(phase.productionConfirm);
      applyPersistedReviseConfirmInterrupt(phase.reviseConfirm);
      idleReconcileKeyRef.current = reconcileKey;
      return;
    }

    try {
      const { state, values: headValues } = await fetchThreadHead(
        stream.client,
        threadId,
      );
      await applyIdleHeadOutcome(
        headValues,
        stream.messages,
        reconcileKey,
        state,
      );
    } catch (error) {
      console.error("[yougan] abnormal reconcile failed", error);
    }
  });

  /**
   * 监听 stream 从 busy→idle（wasStreamEndedBusyRef），在 bootstrap 已完成且仍 in-flight 时触发异常对账。
   * busy 期间清空 idleReconcileKeyRef，允许新一轮 reconcile。
   */
  useEffect(() => {
    const isBusy = stream.isLoading || isJoiningRun;
    const wasBusy = wasStreamEndedBusyRef.current;
    wasStreamEndedBusyRef.current = isBusy;

    if (isBusy) {
      idleReconcileKeyRef.current = null;
      return;
    }
    if (!wasBusy) return;

    if (!threadId || !runDiscoverySettled || isCancelling) return;
    if (stream.isThreadLoading || isResumingInterrupt || isRepairingStaleTurn) {
      return;
    }
    if (
      hasTurnConfirmInterrupt(
        stream.interrupt,
        persistedProductionConfirmInterrupt,
        persistedReviseConfirmInterrupt,
      )
    ) {
      return;
    }
    if (!needsAbnormalReconcile(mergedStreamValues)) return;

    void reconcileAbnormalThreadOnce();
  }, [
    isCancelling,
    isJoiningRun,
    isRepairingStaleTurn,
    isResumingInterrupt,
    mergedStreamValues,
    persistedProductionConfirmInterrupt,
    persistedReviseConfirmInterrupt,
    reconcileAbnormalThreadOnce,
    runDiscoverySettled,
    stream.interrupt,
    stream.isLoading,
    stream.isThreadLoading,
    threadId,
  ]);

  // --- 用户动作：opening bootstrap / 发消息 / 取消 / HITL resume / 物化同步 ---

  /** sessionStorage 里是否还挂着 lg:stream:{threadId}（SDK 写入的活跃 run id） */
  const hasStoredActiveRun = Boolean(
    threadId && getActiveLangGraphRunId(threadId),
  );
  /**
   * 综合判断「当前 thread 是否仍被某一回合占用」。
   * 任一条件为 true 则禁止 send、影响 opening bootstrap、composer 显示 loading 等。
   *
   * - stream.isLoading / isJoiningRun / isRepairingStaleTurn / isResumingInterrupt：本地 SSE 或协调中
   * - hasStoredActiveRun：sessionStorage 认为有 run
   * - production confirm interrupt：HITL 等待用户
   * - !runDiscoverySettled && isTurnInFlight：bootstrap 未完成且 checkpoint 像在执行中（防脏态误发）
   */
  const hasActiveRun =
    stream.isLoading ||
    isJoiningRun ||
    isRepairingStaleTurn ||
    isResumingInterrupt ||
    hasStoredActiveRun ||
    hasTurnConfirmInterrupt(
      stream.interrupt,
      persistedProductionConfirmInterrupt,
      persistedReviseConfirmInterrupt,
    ) ||
    (!runDiscoverySettled && isTurnInFlight(mergedStreamValues));

  /** UI loading 条：SSE 在跑、join 中、或 HITL resume 提交中（不含 repair，repair 通常很快） */
  const isStreamBusy = stream.isLoading || isJoiningRun || isResumingInterrupt;

  /** sendMessage / submitOpeningBootstrap 前等待进行中的 cancel 结束 */
  const awaitCancelIfInFlight = useMemoizedFn(async () => {
    if (cancelInFlightRef.current) {
      await cancelInFlightRef.current;
    }
  });

  /**
   * 空对话 opening：无 messages 时由 useOpeningBootstrapQuery 触发首次 submit。
   * 不带 human message，仅 TURN_EPHEMERAL_RESET + work 快照，agent 产出 opening suggestions。
   */
  const submitOpeningBootstrap = useMemoizedFn(async () => {
    if (!work || !conversation || !token) return;
    if (stream.messages.length > 0) return;
    if (hasActiveRun) return;
    if (suggestionsCache?.has(work.id, conversation.id)) return;
    if (
      hasNextStepSuggestions(
        (stream.values as YouganValues | undefined)?.nextStepSuggestions,
      )
    ) {
      return;
    }

    await awaitCancelIfInFlight();
    setPostCancelValues(null);
    await stream.submit(
      buildStreamSubmitInput(work, conversation, modelTemperature),
      SUBMIT_OPTIONS,
    );
  });

  /** React Query 封装：控制 opening bootstrap 时机（thread 就绪、无 active run 等） */
  const openingBootstrapQuery = useOpeningBootstrapQuery({
    work,
    conversation,
    token,
    messageCount: stream.messages.length,
    isThreadLoading: stream.isThreadLoading,
    isCancelling,
    hasActiveRun,
    hasCachedSuggestions: suggestionsCache?.has(workId, conversationId) ?? false,
    hasCheckpointSuggestions: hasNextStepSuggestions(
      mergedStreamValues?.nextStepSuggestions,
    ),
    submitOpeningBootstrap,
  });

  /**
   * 是否允许用户点「停止生成」。
   * production 环节与 HITL 确认期间禁止 cancel（避免半成品状态）。
   */
  const canCancelActiveTurn = useMemo(
    () =>
      !isProductionTurnActive(mergedStreamValues) &&
      !isReviseTurnActive(mergedStreamValues) &&
      !hasTurnConfirmInterrupt(
        stream.interrupt,
        persistedProductionConfirmInterrupt,
        persistedReviseConfirmInterrupt,
      ),
    [
      mergedStreamValues,
      persistedProductionConfirmInterrupt,
      persistedReviseConfirmInterrupt,
      stream.interrupt,
    ],
  );

  /**
   * 取消当前回合：stop SSE → runs.cancel → updateState(cancelPatch) → postCancelValues。
   *
   * cancelPatch 由 buildTurnFinalizePatch 生成（turn.cancelled + 清空 queue/runProgress）。
   * activeRunId 优先 sessionStorage，否则 runs.list 查找可 cancel 的 run。
   */
  const cancelActiveTurn = useMemoizedFn(async () => {
    if (isCancelling || !canCancelActiveTurn) return;
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
      startCancelling();

      const cancelPatch = buildTurnFinalizePatch(
        stream.values as YouganValues,
        stream.messages,
      );

      /** sessionStorage 无 run id 时向 runs.list 查找（例如其他 tab 写入的情况） */
      const activeRunId =
        threadId &&
        (getActiveLangGraphRunId(threadId) ??
          (await findResumableLangGraphRunId(stream.client, threadId)));

      /** 先断 SSE，再 cancel 服务端 run */
      await stream.stop();

      if (threadId && activeRunId) {
        try {
          /** wait=true：等 run 真正停止后再 updateState */
          await stream.client.runs.cancel(threadId, activeRunId, true);
        } catch (error) {
          console.error("[yougan] cancel run failed", error);
        }
      }

      if (threadId) clearActiveLangGraphRunId(threadId);

      /** updateState 写 cancelPatch；proxy 响应 metadata 里可能带最新 aiUsage */
      let settledAiUsage: ReturnType<typeof aiUsageFromThreadState>;
      if (threadId) {
        try {
          const state = await stream.client.threads.updateState(threadId, {
            values: cancelPatch,
          });
          settledAiUsage = aiUsageFromThreadState(state);
        } catch (error) {
          console.error("[yougan] cancel turn updateState failed", error);
        }
      }

      syncSubscriptionCacheFromAiUsage(
        queryClient,
        settledAiUsage ?? (stream.values as YouganValues | undefined)?.aiUsage,
      );
      setPostCancelValues({
        ...cancelPatch,
        ...(settledAiUsage ? { aiUsage: settledAiUsage } : {}),
      });

      if (workId && conversationId) {
        suppressSuggestionsCacheRef.current = true;
        suggestionsCache?.clear(workId, conversationId);
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
      finishCancelling();
    }
  });

  /**
   * 发送用户消息：optimistic 更新对话标题（默认标题时）→ submit human message + work 快照。
   * 发前清空 postCancelValues，避免旧 cancel patch 污染新回合。
   */
  const sendMessage = useMemoizedFn(
    async (
      text: string,
      attachments: Parameters<typeof buildSubmitHumanMessage>[1] = [],
      previewSelections: Parameters<typeof buildSubmitHumanMessage>[2] = [],
    ) => {
      const message = buildSubmitHumanMessage(
        text,
        attachments,
        previewSelections,
      );
      const content = message.content;
      const hasText =
        typeof content === "string"
          ? Boolean(content.trim())
          : content.some(
              (part) =>
                typeof part === "object" &&
                part != null &&
                "type" in part &&
                part.type === "text" &&
                typeof part.text === "string" &&
                part.text.trim().length > 0,
            );
      const hasPayload =
        hasText ||
        attachments.length > 0 ||
        previewSelections.length > 0;
      if (!hasPayload || !work || !conversation) return;

      suppressSuggestionsCacheRef.current = true;
      suggestionsCache?.clear(work.id, conversation.id);

      /** 首条消息时用内容生成对话标题，optimistic 写 React Query cache */
      if (
        isDefaultConversationTitle(conversation.title) &&
        typeof content === "string"
      ) {
        const title = fallbackConversationTitleFromText(content);
        if (title) {
          patchConversationsCache(queryClient, work.id, (items) =>
            items.map((item) =>
              item.id === conversation.id ? { ...item, title } : item,
            ),
          );
        }
      }

      await awaitCancelIfInFlight();
      setPostCancelValues({
        nextStepSuggestions: null,
        runProgress: null,
      });
      await stream.submit(
        buildStreamSubmitInput(work, conversation, modelTemperature, [message]),
        SUBMIT_OPTIONS,
      );
    },
  );

  /**
   * 恢复 production 确认 interrupt：submit(null, { command: { resume: decision } })。
   * accept → 继续 production 子图；decline → 跳过 production。
   */
  const resumeProductionConfirm = useMemoizedFn(
    async (decision: ProductionConfirmDecision) => {
      if (isResumingInterrupt) return;
      startResumingInterrupt();
      setPersistedProductionConfirmInterrupt(null);
      try {
        await stream.submit(null, {
          ...RESUME_TURN_CONFIRM_OPTIONS,
          command: { resume: decision },
        });
      } finally {
        finishResumingInterrupt();
      }
    },
  );

  const resumeReviseConfirm = useMemoizedFn(
    async (decision: ReviseConfirmDecision) => {
      if (isResumingInterrupt) return;
      startResumingInterrupt();
      setPersistedReviseConfirmInterrupt(null);
      try {
        await stream.submit(null, {
          ...RESUME_TURN_CONFIRM_OPTIONS,
          command: { resume: decision },
        });
      } finally {
        finishResumingInterrupt();
      }
    },
  );

  /**
   * 版本回滚 / 作品恢复后：把物化列写回 checkpoint 并重置 turn 运行时。
   * UI 通过 postCancelValues 立即反映，不依赖 SSE。
   */
  const applyMaterializedWorkState = useMemoizedFn(
    async (restoredWork: Work) => {
      const patch: Partial<YouganValues> = {
        profile: restoredWork.profile,
        references: restoredWork.references,
        preview: restoredWork.preview,
        revision: restoredWork.revision,
        production: restoredWork.production,
        ...TURN_EPHEMERAL_RESET,
      };

      if (threadId) {
        try {
          await stream.client.threads.updateState(threadId, { values: patch });
        } catch (error) {
          console.error("[yougan] apply materialized work state failed", error);
        }
      }

      setPostCancelValues(patch);
      setPersistedProductionConfirmInterrupt(null);
      setPersistedReviseConfirmInterrupt(null);
    },
  );

  /** 侧边栏改 profile 后同步到 checkpoint（fire-and-forget updateState + 本地 patch） */
  const syncMaterializedProfileToStream = useMemoizedFn(
    (profile: WorkProfile) => {
      const patch: Partial<YouganValues> = { profile };
      if (threadId) {
        void stream.client.threads
          .updateState(threadId, { values: patch })
          .catch((error) => {
            console.error("[yougan] sync materialized profile failed", error);
          });
      }
      setPostCancelValues((prev) => ({ ...(prev ?? {}), ...patch }));
    },
  );

  /** 合并 stream.interrupt 与 bootstrap 持久化的 interrupt，供确认弹窗使用 */
  const productionConfirmInterrupt = useMemo(
    () =>
      resolveProductionConfirmInterrupt(
        stream.interrupt,
        persistedProductionConfirmInterrupt,
      ),
    [persistedProductionConfirmInterrupt, stream.interrupt],
  );

  const reviseConfirmInterrupt = useMemo(
    () =>
      resolveReviseConfirmInterrupt(
        stream.interrupt,
        persistedReviseConfirmInterrupt,
      ),
    [persistedReviseConfirmInterrupt, stream.interrupt],
  );

  const isAwaitingTurnConfirm =
    productionConfirmInterrupt != null || reviseConfirmInterrupt != null;

  /**
   * HITL 等待时 run 已是 interrupted 而非 running。
   * 清 sessionStorage 防止刷新后 SDK reconnectOnMount 误 join 已结束的 run。
   */
  useEffect(() => {
    if (!threadId || !isAwaitingTurnConfirm || stream.isLoading) return;
    clearActiveLangGraphRunId(threadId);
  }, [isAwaitingTurnConfirm, stream.isLoading, threadId]);

  // --- 派生 UI 状态与对外返回值 ---

  const canChat = Boolean(work && conversation && token);
  const usageExceeded = mergedStreamValues?.aiUsage?.usageExceeded ?? false;
  /**
   * Composer 发送按钮是否可用。
   * 需登录、未超 AI 配额、无 active run、非 cancel/resume 中、非 HITL 等待。
   */
  const canSend =
    canChat &&
    !usageExceeded &&
    !hasActiveRun &&
    !isCancelling &&
    !isAwaitingTurnConfirm &&
    !isResumingInterrupt;

  /** checkpoint 或会话缓存里是否已有 opening 下一步建议（有则不再 bootstrap） */
  const hasOpeningSuggestions =
    hasNextStepSuggestions(displayStreamValues?.nextStepSuggestions);

  /**
   * 空对话 opening 加载态：无 messages、无 suggestions，且 bootstrap query / thread / stream 仍在忙。
   * 用于聊天区 skeleton，与 hasActiveRun 独立（bootstrap 本身会占 hasActiveRun）。
   */
  const isBootstrappingOpening =
    Boolean(conversation?.id) &&
    stream.messages.length === 0 &&
    !hasOpeningSuggestions &&
    (openingBootstrapQuery.isFetching ||
      openingBootstrapQuery.isPending ||
      stream.isThreadLoading ||
      isCancelling ||
      stream.isLoading);

  /**
   * 对外暴露的 stream 对象（YouganStreamProvider 再包一层 context）。
   * - values：合并 postCancelValues
   * - isLoading：join/resume 期间强制 true，避免 composer 误以为可发送
   */
  const streamWithPostCancel = useMemo(() => {
    const values = (displayStreamValues ?? stream.values) as
      | YouganValues
      | undefined;
    const base = { ...stream, values: values as YouganValues };
    return isStreamBusy ? { ...base, isLoading: true } : base;
  }, [displayStreamValues, isStreamBusy, stream]);

  /**
   * 聊天区底部进度文案：来自 checkpoint values.runProgress。
   * HITL 等待时不显示进度。
   */
  const runProgress = useMemo(() => {
    if (isAwaitingTurnConfirm) return null;
    return (
      (streamWithPostCancel.values as YouganValues | undefined)?.runProgress ??
      null
    );
  }, [isAwaitingTurnConfirm, streamWithPostCancel.values]);

  return {
    /** LangGraph stream（含合并 values 与扩展 isLoading） */
    stream: streamWithPostCancel,
    /** 当前 run 进度 label，供 composer / 消息列表展示 */
    runProgress,
    threadId,
    sendMessage,
    cancelActiveTurn,
    canCancelActiveTurn,
    resumeProductionConfirm,
    resumeReviseConfirm,
    applyMaterializedWorkState,
    syncMaterializedProfileToStream,
    productionConfirmInterrupt,
    reviseConfirmInterrupt,
    isResumingInterrupt,
    isCancelling,
    canSend,
    usageExceeded,
    aiUsage: mergedStreamValues?.aiUsage,
    isBootstrappingOpening,
    canChat,
  };
}

/** useYouganStream 返回值类型，供 YouganStreamProvider context 使用 */
export type YouganStream = ReturnType<typeof useYouganStream>;
