/** 单轮用户消息解析出的有序队列项（先入先执行）；均为对话子图，无静默 patch 项 */
export const TURN_QUEUE_KINDS = [
  "outline",
  "inspiration",
  "creation",
  "ask",
] as const;

export type TurnQueueKind = (typeof TURN_QUEUE_KINDS)[number];

/** 队列项执行优先级（用于排序与去重） */
export const TURN_QUEUE_ORDER: readonly TurnQueueKind[] = [
  "outline",
  "inspiration",
  "creation",
  "ask",
];

export function sortTurnQueue(kinds: TurnQueueKind[]): TurnQueueKind[] {
  const set = new Set(kinds);
  return TURN_QUEUE_ORDER.filter((kind) => set.has(kind));
}
