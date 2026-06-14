import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import { getWriter } from "@langchain/langgraph";
import type { RunProgress } from "@yougan/domain";

import type { AgentStatePatch } from "#agent/state.js";

/** 与前端 onCustomEvent 约定的事件名 */
export const RUN_PROGRESS_EVENT = "run_progress" as const;

export type RunProgressCustomPayload = {
  event: typeof RUN_PROGRESS_EVENT;
  progress: RunProgress;
};

export function buildRunProgress(
  phase: RunProgress["phase"],
  label: string,
  detail?: string | null,
): RunProgress {
  return {
    phase,
    label,
    detail: detail ?? null,
    updatedAt: Date.now(),
  };
}

/** 经 custom stream 推送进度（SSE 心跳 + 前端即时展示） */
export function emitRunProgress(
  progress: RunProgress,
  config?: LangGraphRunnableConfig,
): void {
  const writer = getWriter(config);
  if (!writer) return;
  const payload: RunProgressCustomPayload = {
    event: RUN_PROGRESS_EVENT,
    progress: { ...progress, updatedAt: Date.now() },
  };
  writer(payload);
}

export function patchRunProgress(progress: RunProgress): AgentStatePatch {
  return { runProgress: progress };
}

export function clearRunProgressPatch(): AgentStatePatch {
  return { runProgress: null };
}

/** 长耗时 work 包裹：进入时推送进度，并定时心跳直至完成 */
export async function withRunProgressHeartbeat<T>(
  progress: RunProgress,
  config: LangGraphRunnableConfig | undefined,
  work: () => Promise<T>,
  intervalMs = 12_000,
): Promise<T> {
  emitRunProgress(progress, config);
  const timer = setInterval(() => {
    emitRunProgress(progress, config);
  }, intervalMs);
  try {
    return await work();
  } finally {
    clearInterval(timer);
  }
}

export function isRunProgressCustomPayload(
  data: unknown,
): data is RunProgressCustomPayload {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  return (
    record.event === RUN_PROGRESS_EVENT &&
    record.progress != null &&
    typeof record.progress === "object"
  );
}
