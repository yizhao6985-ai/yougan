import type { Client, Message } from "@langchain/langgraph-sdk";
import { EMPTY_TURN_RUNTIME, mergeTurnRuntime } from "@yougan/domain";

import type { YouganValues } from "@/lib/types";

import { buildTurnCancelPatch } from "./cancel-turn";

/** LangGraph SDK 将活跃 run id 写入 sessionStorage 的 key 前缀 */
const LANGGRAPH_STREAM_RUN_KEY_PREFIX = "lg:stream:";

const ACTIVE_LANGGRAPH_RUN_STATUSES = new Set(["pending", "running"]);

/** 仍可恢复/等待用户操作的 run（含 HITL interrupt） */
const RESUMABLE_LANGGRAPH_RUN_STATUSES = new Set([
  "pending",
  "running",
  "interrupted",
]);

/** 新 submit 前重置的回合运行时与验收产物 */
export const TURN_EPHEMERAL_RESET: Pick<
  YouganValues,
  "turn" | "nextStepSuggestions" | "runProgress"
> = {
  turn: { ...EMPTY_TURN_RUNTIME },
  nextStepSuggestions: null,
  runProgress: null,
};

export function getActiveLangGraphRunId(threadId: string): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(`${LANGGRAPH_STREAM_RUN_KEY_PREFIX}${threadId}`);
}

export function clearActiveLangGraphRunId(threadId: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(`${LANGGRAPH_STREAM_RUN_KEY_PREFIX}${threadId}`);
}

export function isActiveLangGraphRunStatus(status: string): boolean {
  return ACTIVE_LANGGRAPH_RUN_STATUSES.has(status);
}

export function isResumableLangGraphRunStatus(status: string): boolean {
  return RESUMABLE_LANGGRAPH_RUN_STATUSES.has(status);
}

/** LangGraph checkpoint 中不存在该 thread（常见：Agent 库重置后 conversation 仍保留 threadId） */
export function isLangGraphThreadMissingError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : error && typeof error === "object" && "message" in error &&
          typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : typeof error === "string"
          ? error
          : "";

  const normalized = message.toLowerCase();
  return normalized.includes("not found") && normalized.includes("thread");
}

/** production 环节进行中（含制作前确认 interrupt）时禁止前端取消 */
export function isProductionTurnActive(
  values: YouganValues | null | undefined,
): boolean {
  const turn = values?.turn;
  if (turn?.activeKind === "production") return true;
  return turn?.queue?.[0] === "production";
}

/** checkpoint 是否表示回合仍在执行（非 committed / cancelled） */
export function isTurnInFlight(values: YouganValues | null | undefined): boolean {
  const turn = values?.turn;
  if (!turn || turn.committed || turn.cancelled) return false;
  if (turn.activeKind != null || (turn.queue?.length ?? 0) > 0) return true;
  return values?.runProgress != null;
}

/** sessionStorage 或 runs.list 解析可 join 的 run id；无则返回 null */
export async function findResumableLangGraphRunId(
  client: Client,
  threadId: string,
): Promise<string | null> {
  const storedRunId = getActiveLangGraphRunId(threadId);
  if (storedRunId) {
    try {
      const run = await client.runs.get(threadId, storedRunId);
      if (isResumableLangGraphRunStatus(run.status)) return storedRunId;
    } catch {
      // stale session entry
    }
    clearActiveLangGraphRunId(threadId);
  }

  try {
    for (const status of ["interrupted", "running", "pending"] as const) {
      const runs = await client.runs.list(threadId, { status, limit: 1 });
      const runId = runs[0]?.run_id;
      if (runId) return runId;
    }
  } catch (error) {
    if (isLangGraphThreadMissingError(error)) return null;
    throw error;
  }

  return null;
}

/** 取消完成后写入 checkpoint 的完整回合清理 patch */
export function buildTurnFinalizePatch(
  prev: YouganValues | null | undefined,
  messages: Message[],
): Pick<
  YouganValues,
  "turn" | "nextStepSuggestions" | "runProgress"
> {
  const { turn: cancelled } = buildTurnCancelPatch(prev, messages);
  return {
    turn: mergeTurnRuntime(cancelled ?? EMPTY_TURN_RUNTIME, {
      queue: [],
      activeKind: null,
      completedKinds: [],
    }),
    nextStepSuggestions: null,
    runProgress: null,
  };
}
