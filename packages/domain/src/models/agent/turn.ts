import type { TurnStaging } from "./staging.js";

/**
 * 单轮用户消息解析出的有序子图队列（FIFO）。
 * planTurnQueue 产出 kinds；带附件时系统会自动前置 reference 分析新素材；无附件时删/改参考由模型输出 reference。
 */
export const TURN_QUEUE_KINDS = [
  "reference",
  "profile",
  "production",
  "ask",
] as const;

export type TurnQueueKind = (typeof TURN_QUEUE_KINDS)[number];

/**
 * 队列排序权重（升序执行）。
 * reference → 素材分析入库；profile → 方案；production → 出稿；ask → 纯答疑。
 */
export const TURN_QUEUE_ORDER: readonly TurnQueueKind[] = [
  "reference",
  "profile",
  "production",
  "ask",
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

export function mergeTurnRuntime(
  prev: TurnRuntime,
  patch: Partial<TurnRuntime>,
): TurnRuntime {
  return { ...prev, ...patch };
}
