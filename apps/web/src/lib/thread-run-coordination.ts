import type { Client, ThreadState } from "@langchain/langgraph-sdk";
import type {
  ProductionConfirmInterruptValue,
  ReviseConfirmInterruptValue,
} from "@yougan/domain";

import type { YouganValues } from "@/lib/types";
import {
  getProductionConfirmInterruptFromThread,
  getProductionConfirmInterruptFromThreadState,
} from "@/lib/production-confirm-interrupt";
import {
  getReviseConfirmInterruptFromThread,
  getReviseConfirmInterruptFromThreadState,
} from "@/lib/revise-confirm-interrupt";
import {
  findResumableLangGraphRunId,
  isActiveLangGraphRunStatus,
  isProtectedFromStaleTurnRepair,
  isTurnInFlight,
} from "@/lib/turn-lifecycle";

export type ThreadRunPhase =
  | { kind: "running"; runId: string }
  | {
      kind: "interrupted";
      runId: string;
      productionConfirm: ProductionConfirmInterruptValue | null;
      reviseConfirm: ReviseConfirmInterruptValue | null;
    }
  | { kind: "idle" };

export function isSameProductionConfirmInterrupt(
  a: ProductionConfirmInterruptValue | null | undefined,
  b: ProductionConfirmInterruptValue | null | undefined,
): boolean {
  if (a == null || b == null) return false;
  return (
    a.kind === b.kind && a.title === b.title && a.message === b.message
  );
}

async function fetchThreadInterruptState(client: Client, threadId: string) {
  const state = await client.threads.getState(threadId, undefined, {
    subgraphs: true,
  });
  const thread = await client.threads.get(threadId);
  return { state, thread };
}

/** 从 thread head 读取 production 确认 interrupt（bootstrap 专用，单次拉取） */
export async function fetchProductionConfirmInterrupt(
  client: Client,
  threadId: string,
): Promise<ProductionConfirmInterruptValue | null> {
  const { state, thread } = await fetchThreadInterruptState(client, threadId);
  const fromState = getProductionConfirmInterruptFromThreadState(state);
  if (fromState) return fromState;
  return getProductionConfirmInterruptFromThread(thread);
}

/** 从 thread head 读取改稿确认 interrupt（bootstrap 专用，单次拉取） */
export async function fetchReviseConfirmInterrupt(
  client: Client,
  threadId: string,
): Promise<ReviseConfirmInterruptValue | null> {
  const { state, thread } = await fetchThreadInterruptState(client, threadId);
  const fromState = getReviseConfirmInterruptFromThreadState(state);
  if (fromState) return fromState;
  return getReviseConfirmInterruptFromThread(thread);
}

export async function fetchThreadHead(
  client: Client,
  threadId: string,
): Promise<{ state: ThreadState; values: YouganValues }> {
  const state = await client.threads.getState(threadId);
  return { state, values: (state.values ?? {}) as YouganValues };
}

/**
 * 以 runs.list / runs.get 为准判断 thread 当前阶段：
 * running → join；interrupted → 等用户 resume；idle → 只读对齐或兜底 repair。
 */
export async function resolveThreadRunPhase(
  client: Client,
  threadId: string,
): Promise<ThreadRunPhase> {
  const runId = await findResumableLangGraphRunId(client, threadId);
  if (!runId) return { kind: "idle" };

  const run = await client.runs.get(threadId, runId);
  if (run.status === "interrupted") {
    const { state, thread } = await fetchThreadInterruptState(client, threadId);
    const productionConfirm =
      getProductionConfirmInterruptFromThreadState(state) ??
      getProductionConfirmInterruptFromThread(thread);
    const reviseConfirm =
      getReviseConfirmInterruptFromThreadState(state) ??
      getReviseConfirmInterruptFromThread(thread);
    return { kind: "interrupted", runId, productionConfirm, reviseConfirm };
  }
  if (isActiveLangGraphRunStatus(run.status)) {
    return { kind: "running", runId };
  }
  return { kind: "idle" };
}

/**
 * stream 已停但本地仍 in-flight（且非 production 保护回合）→ 可疑，需 reconcile。
 * 正常结束（committed/cancelled）时 isTurnInFlight 为 false，不会进入此路径。
 */
export function needsAbnormalReconcile(
  values: YouganValues | null | undefined,
): boolean {
  if (!isTurnInFlight(values)) return false;
  if (isProtectedFromStaleTurnRepair(values)) return false;
  return true;
}

/**
 * agent 已 committed/cancelled 时，用 thread head 只读对齐前端（不写 checkpoint）。
 */
export function buildReadSyncPatchFromThreadHead(
  head: YouganValues,
): Partial<YouganValues> | null {
  const turn = head.turn;
  if (!turn?.committed && !turn?.cancelled) return null;

  return {
    turn,
    turnDirections: head.turnDirections ?? null,
    runProgress: null,
  };
}

/**
 * 仅在 phase=idle 且 thread head 仍显示回合悬空、但无任何可 join/interrupt 的 run 时，
 * 才允许客户端写入 repair patch。
 */
export function shouldWriteStaleTurnRepair(
  phase: ThreadRunPhase,
  headValues: YouganValues,
): boolean {
  if (phase.kind !== "idle") return false;
  if (isProtectedFromStaleTurnRepair(headValues)) return false;
  if (headValues.turn?.committed || headValues.turn?.cancelled) return false;
  return isTurnInFlight(headValues);
}
