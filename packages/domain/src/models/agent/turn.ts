import type { TurnStaging } from "./staging.js";

/**
 * 单轮用户消息解析出的有序子图队列（FIFO）。
 * planTurnQueue 产出 kinds；带附件时系统前置 reference；队尾常驻 suggestions；其余由模型规划。
 */
/** planTurnQueue LLM 可输出的队列项（不含系统常驻的 suggestions） */
export const TURN_QUEUE_PLANNER_KINDS = [
  "reference",
  "profile",
  "production",
  "ask",
] as const;

export type TurnQueuePlannerKind = (typeof TURN_QUEUE_PLANNER_KINDS)[number];

export const TURN_QUEUE_KINDS = [
  ...TURN_QUEUE_PLANNER_KINDS,
  "suggestions",
] as const;

export type TurnQueueKind = (typeof TURN_QUEUE_KINDS)[number];

/**
 * 队列排序权重（升序执行）。
 * reference → 素材；profile → 方案；production → 出稿；ask → 答疑；suggestions → 下一步建议（系统常驻队尾）。
 */
export const TURN_QUEUE_ORDER: readonly TurnQueueKind[] = [
  "reference",
  "profile",
  "production",
  "ask",
  "suggestions",
];

/**
 * 单轮执行运行时（控制 agent 图调度、草稿、取消）。
 * 不 commit 到 Work；整包 reset / finalize。
 */
export interface TurnRuntime {
  queue: TurnQueueKind[];
  activeKind: TurnQueueKind | null;
  completedKinds: TurnQueueKind[];
  staging: TurnStaging | null;
  committed: boolean;
  cancelled: boolean;
  interruptedMessageIds: string[];
}

export const EMPTY_TURN_RUNTIME: TurnRuntime = {
  queue: [],
  activeKind: null,
  completedKinds: [],
  staging: null,
  committed: false,
  cancelled: false,
  interruptedMessageIds: [],
};

function mergeTurnStaging(
  prev: TurnStaging | null,
  next: TurnStaging | null | undefined,
): TurnStaging | null {
  if (next === undefined) return prev;
  if (next === null) return null;
  if (!prev) return next;
  return {
    ...prev,
    ...next,
    production: next.production
      ? { ...prev.production, ...next.production }
      : prev.production,
  };
}

export function mergeTurnRuntime(
  prev: TurnRuntime,
  patch: Partial<TurnRuntime>,
): TurnRuntime {
  const merged = { ...prev, ...patch };
  if ("staging" in patch) {
    merged.staging = mergeTurnStaging(prev.staging, patch.staging);
  }
  return merged;
}
