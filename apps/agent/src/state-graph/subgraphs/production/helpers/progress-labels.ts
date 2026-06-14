import type { RunProgress } from "@yougan/domain";

import { buildRunProgress } from "#agent/state-io/run-progress.js";

export function productionPlanProgress(): RunProgress {
  return buildRunProgress("production_plan", "正在制定制作计划…");
}

export function productionDispatchProgress(taskDescription?: string): RunProgress {
  return buildRunProgress(
    "production_dispatch",
    "正在分配制作任务…",
    taskDescription?.trim() || null,
  );
}

export function productionExecuteWritingProgress(
  taskDescription?: string,
): RunProgress {
  return buildRunProgress(
    "production_execute_writing",
    "正在撰写内容…",
    taskDescription?.trim() || null,
  );
}

export function productionExecuteDesignProgress(
  taskDescription?: string,
): RunProgress {
  return buildRunProgress(
    "production_execute_design",
    "正在设计视觉…",
    taskDescription?.trim() || null,
  );
}

export function productionAcceptProgress(taskDescription?: string): RunProgress {
  return buildRunProgress(
    "production_accept",
    "正在验收任务…",
    taskDescription?.trim() || null,
  );
}

export function productionAssembleProgress(): RunProgress {
  return buildRunProgress("production_assemble", "正在整合成稿…");
}

export function productionSummarizeProgress(): RunProgress {
  return buildRunProgress("production_summarize", "正在总结本轮创作…");
}
