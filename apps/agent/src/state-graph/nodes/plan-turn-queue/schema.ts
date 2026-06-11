/** planTurnQueue 结构化输出：本轮子图执行队列 */
import { z } from "zod";

import { TURN_QUEUE_KINDS } from "@yougan/domain";

export const TurnQueueDecisionSchema = z.object({
  kinds: z
    .array(z.enum(TURN_QUEUE_KINDS))
    .min(1)
    .max(8)
    .describe(
      "本轮按顺序执行的对话子图队列。例：删参考 → reference；改方案+出稿 → profile, production；有附件时勿输出 reference（系统自动前置）",
    ),
  reason: z.string().describe("一句话说明队列拆分依据"),
});

export type TurnQueueDecision = z.infer<typeof TurnQueueDecisionSchema>;
