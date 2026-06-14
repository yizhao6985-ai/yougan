import type { RunProgress } from "@yougan/domain";

export const RUN_PROGRESS_EVENT = "run_progress" as const;

export type RunProgressCustomPayload = {
  event: typeof RUN_PROGRESS_EVENT;
  progress: RunProgress;
};

export function isRunProgressCustomPayload(
  data: unknown,
): data is RunProgressCustomPayload {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  if (record.event !== RUN_PROGRESS_EVENT) return false;
  const progress = record.progress;
  if (!progress || typeof progress !== "object") return false;
  const p = progress as Record<string, unknown>;
  return typeof p.label === "string" && typeof p.updatedAt === "number";
}

/** custom 心跳与 updates 合并：取 updatedAt 较新者 */
export function pickRunProgress(
  live: RunProgress | null | undefined,
  fromValues: RunProgress | null | undefined,
): RunProgress | null {
  if (!live) return fromValues ?? null;
  if (!fromValues) return live;
  return live.updatedAt >= fromValues.updatedAt ? live : fromValues;
}
