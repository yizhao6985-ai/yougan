import { type TurnQueueKind } from "@yougan/domain";

import { sortTurnQueue } from "./sort-turn-queue.js";

/** 队列去重排序；回合末延伸方向在队列跑完后由 generateTurnDirections 生成 */
export function finalizeTurnQueue(kinds: TurnQueueKind[]): TurnQueueKind[] {
  return sortTurnQueue(kinds);
}
