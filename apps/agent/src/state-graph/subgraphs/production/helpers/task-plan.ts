/** 制作计划任务路由与 patch 辅助 */
import type { ProductionTask, WorkProduction } from "@yougan/domain";

import type { AgentStateType } from "#agent/state.js";
import { resolveProductionAudioAsset } from "./resolve-production-audio-asset.js";

import { acceptAttemptsExhausted } from "./pipeline.js";
import { isValidDesignPromptDeliverable } from "../nodes/accept-task/helpers/deliverable.js";

export function isAudioTask(task: ProductionTask): boolean {
  return task.department === "audio";
}

export function audioTaskNeedsIngest(
  state: AgentStateType,
  task: ProductionTask,
): boolean {
  if (!isAudioTask(task)) return false;
  return resolveProductionAudioAsset(state) != null;
}

export function isDesignTask(task: ProductionTask): boolean {
  return task.department === "design";
}

export function designTaskHasRenderedImage(task: ProductionTask): boolean {
  return Boolean(task.deliverable?.images?.[0]?.url?.trim());
}

export function taskNeedsRender(task: ProductionTask): boolean {
  if (!isDesignTask(task) || taskHasTerminalFailure(task) || isTaskReady(task)) {
    return false;
  }
  if (!isValidDesignPromptDeliverable(task.deliverable)) return false;
  return !designTaskHasRenderedImage(task);
}

export function isTaskReady(task: ProductionTask): boolean {
  return task.status === "ready";
}

export function taskAwaitingAccept(task: ProductionTask): boolean {
  if (task.status !== "in_progress") return false;
  if (isDesignTask(task)) {
    if (!task.deliverable?.body?.trim()) return false;
    return designTaskHasRenderedImage(task);
  }
  if (isAudioTask(task) && audioDeliverableHasTranscript(task)) {
    return Boolean(task.deliverable?.body?.trim());
  }
  if (!task.deliverable?.body?.trim()) return false;
  return true;
}

function audioDeliverableHasTranscript(task: ProductionTask): boolean {
  const url = task.deliverable?.body?.trim() ?? "";
  if (!url) return false;
  return Boolean(task.deliverable?.notes?.trim());
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
  if (active && (taskNeedsProduce(active) || taskNeedsRender(active))) {
    return active.id;
  }
  const next = nextPendingTask(production);
  return next?.id ?? null;
}

/**
 * dispatchTask 无任务可派且计划未收尾时，管线已卡住（典型：dispatch ↔ route 空转）。
 * 由 afterRouteProduction 转入 summarizeProduction 结束子图。
 */
export function productionPipelineStuck(
  production: WorkProduction,
): boolean {
  if (
    productionPlanIsEmpty(production) ||
    allTasksReady(production) ||
    productionHasTerminalFailure(production)
  ) {
    return false;
  }
  if (production.pending_tasks.some(taskAwaitingAccept)) {
    return false;
  }
  if (production.pending_tasks.some(taskNeedsRender)) {
    return false;
  }
  return resolveDispatchTaskId(production) == null;
}

export function taskNeedsProduce(task: ProductionTask): boolean {
  if (taskHasTerminalFailure(task)) return false;
  if (isTaskReady(task)) return false;
  if (taskAwaitingAccept(task)) return false;
  if (taskNeedsRender(task)) return false;
  if (acceptAttemptsExhausted(task)) return false;
  return true;
}

/** dispatch 路由：音频素材入库任务走 ingestProductionAudio */
export function audioTaskNeedsIngestProduce(
  state: AgentStateType,
  task: ProductionTask,
): boolean {
  return isAudioTask(task) && audioTaskNeedsIngest(state, task) && taskNeedsProduce(task);
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
