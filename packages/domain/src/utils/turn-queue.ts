import {
  TURN_QUEUE_ORDER,
  type TurnQueueKind,
} from "../models/agent/turn-queue.js";

export function sortTurnQueue(kinds: TurnQueueKind[]): TurnQueueKind[] {
  const set = new Set(kinds);
  return TURN_QUEUE_ORDER.filter((kind) => set.has(kind));
}
