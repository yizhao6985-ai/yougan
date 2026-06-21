import { type TurnQueueKind } from "@yougan/domain";

import { sortTurnQueue } from "./sort-turn-queue.js";

/** 队列去重排序；suggestions 在 commitTurn 后由系统节点生成，不入队 */
export function finalizeTurnQueue(kinds: TurnQueueKind[]): TurnQueueKind[] {
  const base = kinds.filter((kind) => kind !== "suggestions");
  return sortTurnQueue(base);
}
