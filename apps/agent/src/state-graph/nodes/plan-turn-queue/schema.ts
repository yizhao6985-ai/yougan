/** planTurnQueue 结构化输出：本轮子图执行队列 */
import { z } from "zod";

import { TURN_QUEUE_PLANNER_KINDS } from "@yougan/domain";

export const TurnQueueDecisionSchema = z.object({
  kinds: z
    .array(z.enum(TURN_QUEUE_PLANNER_KINDS))
    .min(1)
    .max(8)
    .describe(
      "本轮按顺序执行的对话子图队列。production 仅当用户明确要求出稿/开写/改稿时输出；描述创作想法、补方案、聊方向 → profile；删参考 → reference",
    ),
  reason: z.string().describe("一句话说明队列拆分依据"),
});

export type TurnQueueDecision = z.infer<typeof TurnQueueDecisionSchema>;
