/** 制作计划任务路由与 patch 辅助 */
import type { ProductionTask, WorkProduction } from "@yougan/domain";

import { acceptAttemptsExhausted } from "./pipeline.js";

export function isTaskReady(task: ProductionTask): boolean {
  return task.status === "ready";
}

export function taskAwaitingAccept(task: ProductionTask): boolean {
  return (
    task.status === "in_progress" &&
    Boolean(task.deliverable?.body?.trim())
  );
}

export function taskHasTerminalFailure(task: ProductionTask): boolean {
  return task.status === "failed" || Boolean(task.failure_message?.trim());
}

export function productionPlanIsEmpty(production: WorkProduction): boolean {
  return production.pending_tasks.length === 0;
}

export function productionHasTerminalFailure(
  production: WorkProduction,
): boolean {
  return production.pending_tasks.some(taskHasTerminalFailure);
}

export function firstProductionFailureMessage(
  production: WorkProduction,
): string | null {
  const task = production.pending_tasks.find(taskHasTerminalFailure);
  return task?.failure_message?.trim() ?? null;
}

function isRunnableTask(task: ProductionTask): boolean {
  return !taskHasTerminalFailure(task);
}

/** 当前 in_progress 任务（管线中唯一活跃任务） */
export function currentActiveTask(
  production: WorkProduction,
): ProductionTask | undefined {
  return production.pending_tasks.find(
    (t) => t.status === "in_progress" && isRunnableTask(t),
  );
}

export function nextPendingTask(
  production: WorkProduction,
): ProductionTask | undefined {
  return production.pending_tasks.find(
    (t) => t.status === "pending" && isRunnableTask(t),
  );
}

/** dispatchTask：需重试的 in_progress，或下一个 pending */
export function resolveDispatchTaskId(
  production: WorkProduction,
): string | null {
  if (productionHasTerminalFailure(production) || allTasksReady(production)) {
    return null;
  }
  const active = currentActiveTask(production);
  if (active && taskNeedsProduce(active)) {
    return active.id;
  }
  const next = nextPendingTask(production);
  return next?.id ?? null;
}

export function taskNeedsProduce(task: ProductionTask): boolean {
  if (taskHasTerminalFailure(task)) return false;
  if (isTaskReady(task)) return false;
  if (taskAwaitingAccept(task)) return false;
  if (acceptAttemptsExhausted(task)) return false;
  return true;
}

/** 将指定任务标为 in_progress，其余未 ready 的 in_progress 退回 pending */
export function withActiveTask(
  plan: WorkProduction,
  taskId: string,
): WorkProduction {
  return {
    ...plan,
    pending_tasks: plan.pending_tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, status: "in_progress" as const };
      }
      if (t.status === "in_progress" && !isTaskReady(t)) {
        return { ...t, status: "pending" as const };
      }
      return t;
    }),
  };
}

export function allTasksReady(production: WorkProduction): boolean {
  return (
    production.pending_tasks.length > 0 &&
    production.pending_tasks.every((t) => isTaskReady(t))
  );
}

export function defaultTaskGuidance(description: string): {
  direction: string;
  acceptance_criteria: string;
} {
  return {
    direction: description,
    acceptance_criteria:
      "产出须完整响应该任务目标，并契合作品方案的主题、体裁、表达方向与创作规则；无明显跑题、空洞或违背方案约束。",
  };
}
