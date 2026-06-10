import {
  TURN_QUEUE_ORDER,
  type TurnQueueKind,
} from "@yougan/domain";

/** 按领域约定的执行顺序去重排序（LLM 输出顺序不稳定）。 */
export function sortTurnQueue(kinds: TurnQueueKind[]): TurnQueueKind[] {
  const set = new Set(kinds);
  return TURN_QUEUE_ORDER.filter((kind) => set.has(kind));
}
