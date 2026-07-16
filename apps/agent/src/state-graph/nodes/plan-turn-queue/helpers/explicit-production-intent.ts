import type { TurnQueuePlannerKind } from "@yougan/domain";

/**
 * 明确开写/开制口令。命中时确定性补入 production，避免 LLM 因可选步未填而只出 profile。
 * 不含含糊确认（好的/可以/就这样）——那些仍只走 profile。
 */
const EXPLICIT_START_PRODUCTION_RE =
  /开始制作|开始创作|开始写(?:作|稿)?|开写|可以写了|可以出稿了|开始出稿|重新制作|按方案重新(?:生成|制作)|整稿重做|另写一[版篇]|重写一[版篇]/;

export function isExplicitStartProductionIntent(userMessage: string): boolean {
  const text = userMessage.trim();
  if (!text) return false;
  return EXPLICIT_START_PRODUCTION_RE.test(text);
}

/** 用户明确要求开写时，确保队列含 production（仍须过 canQueueProduction 门禁）。 */
export function withExplicitProductionIntent(
  queue: TurnQueuePlannerKind[],
  userMessage: string,
): TurnQueuePlannerKind[] {
  if (!isExplicitStartProductionIntent(userMessage)) {
    return queue;
  }
  if (queue.includes("production")) {
    return queue;
  }
  return [...queue, "production"];
}
