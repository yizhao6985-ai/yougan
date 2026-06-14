import type { ProductionTask } from "@yougan/domain";

/** 单任务验收最多尝试次数（含首次验收） */
export const MAX_ACCEPT_ATTEMPTS = 5;

export function acceptAttemptsExhausted(task: ProductionTask): boolean {
  return (task.accept_retry_count ?? 0) >= MAX_ACCEPT_ATTEMPTS;
}
