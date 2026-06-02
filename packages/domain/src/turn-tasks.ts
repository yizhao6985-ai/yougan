/** 单轮用户消息解析出的有序任务队列（先入先执行） */
export const TURN_TASK_KINDS = [
  "references",
  "brief",
  "ensure_outline",
  "outline_patch",
  "outline",
  "inspiration",
  "creation",
  "ask",
] as const;

export type TurnTaskKind = (typeof TURN_TASK_KINDS)[number];

/** 任务执行优先级（用于排序与去重） */
export const TURN_TASK_ORDER: readonly TurnTaskKind[] = [
  "references",
  "brief",
  "ensure_outline",
  "outline_patch",
  "outline",
  "inspiration",
  "creation",
  "ask",
];

export function sortTurnTasks(tasks: TurnTaskKind[]): TurnTaskKind[] {
  const set = new Set(tasks);
  return TURN_TASK_ORDER.filter((task) => set.has(task));
}
