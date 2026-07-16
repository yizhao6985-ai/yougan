import { type TurnQueueKind } from "@yougan/domain";

import { sortTurnQueue } from "./sort-turn-queue.js";

/** 队列去重排序；延伸方向与主回合并行生成，commitTurn 时写入 turnDirections */
export function finalizeTurnQueue(kinds: TurnQueueKind[]): TurnQueueKind[] {
  return sortTurnQueue(kinds);
}
