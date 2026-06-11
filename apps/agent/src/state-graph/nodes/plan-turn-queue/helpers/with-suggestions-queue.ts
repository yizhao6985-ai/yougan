import { type TurnQueueKind } from "@yougan/domain";

import { sortTurnQueue } from "./sort-turn-queue.js";

/** 系统常驻：队尾追加 suggestions（去重后排序） */
export function withSuggestionsQueue(kinds: TurnQueueKind[]): TurnQueueKind[] {
  const base = kinds.filter((kind) => kind !== "suggestions");
  return sortTurnQueue([...base, "suggestions"]);
}
