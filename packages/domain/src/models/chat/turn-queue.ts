/** 单轮用户消息解析出的有序队列项（先入先执行） */
export const TURN_QUEUE_KINDS = ["profile", "production", "ask"] as const;

export type TurnQueueKind = (typeof TURN_QUEUE_KINDS)[number];

/** 队列项执行优先级（用于排序与去重） */
export const TURN_QUEUE_ORDER: readonly TurnQueueKind[] = [
  "profile",
  "production",
  "ask",
];
