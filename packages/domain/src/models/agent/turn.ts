import type {
  ProductionConfirmDecision,
  ReviseConfirmDecision,
} from "./interrupts.js";
import type { TurnStaging } from "./staging.js";
import { mergeProfileState } from "../../utils/profile-merge.js";
import { mergeReferencesState } from "../../utils/reference-merge.js";

/**
 * 单轮用户消息解析出的有序子图队列（FIFO）。
 * planTurnQueue 产出 kinds；延伸方向与队列并行由 generateTurnDirections 生成，commitTurn 提交。
 */
/** planTurnQueue LLM 可输出的队列项 */
export const TURN_QUEUE_PLANNER_KINDS = [
  "profile",
  "production",
  "collectRevision",
  "revise",
  "ask",
] as const;

export type TurnQueuePlannerKind = (typeof TURN_QUEUE_PLANNER_KINDS)[number];

export const TURN_QUEUE_KINDS = [...TURN_QUEUE_PLANNER_KINDS] as const;

export type TurnQueueKind = (typeof TURN_QUEUE_KINDS)[number];

/**
 * 队列排序权重（升序执行）。
 */
export const TURN_QUEUE_ORDER: readonly TurnQueueKind[] = [
  "profile",
  "production",
  "collectRevision",
  "revise",
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
  /** confirmProductionTurn interrupt 恢复后写入；decline 时跳过 production 子图 */
  productionConfirm: ProductionConfirmDecision | null;
  /** confirmReviseTurn interrupt 恢复后写入；decline 时跳过 revise 子图 */
  reviseConfirm: ReviseConfirmDecision | null;
}

export const EMPTY_TURN_RUNTIME: TurnRuntime = {
  queue: [],
  activeKind: null,
  completedKinds: [],
  staging: null,
  committed: false,
  cancelled: false,
  interruptedMessageIds: [],
  productionConfirm: null,
  reviseConfirm: null,
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
    profile: next.profile
      ? mergeProfileState(prev.profile, next.profile)
      : prev.profile,
    references: next.references
      ? mergeReferencesState(prev.references, next.references)
      : prev.references,
    production: next.production
      ? { ...prev.production, ...next.production }
      : prev.production,
    preview: next.preview !== undefined ? next.preview : prev.preview,
    revision: next.revision ? { ...prev.revision, ...next.revision } : prev.revision,
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
