/**
 * 单轮用户消息解析出的有序子图队列（FIFO）。
 * orchestrateTurn 产出 kinds；带附件时系统会自动前置 reference。
 */
export const TURN_QUEUE_KINDS = ["reference", "profile", "production", "ask"] as const;

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
