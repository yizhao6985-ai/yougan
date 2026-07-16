/** planTurnQueue 结构化输出：本轮子图执行队列 */
import { z } from "zod";

import { TURN_QUEUE_PLANNER_KINDS } from "@yougan/domain";

export const TurnQueueDecisionSchema = z.object({
  kinds: z
    .array(z.enum(TURN_QUEUE_PLANNER_KINDS))
    .min(1)
    .max(8)
    .describe(
      "本轮按顺序执行的对话子图队列。production=开写或整稿重做（按方案重新生成作品，非局部改稿）；collectRevision=有成稿时记录局部改稿意见；revise=在现有成稿上执行改稿；profile=改方案/聊方向；ask=纯答疑；整稿重做时禁止 collectRevision/revise",
    ),
  reason: z.string().describe("一句话说明队列拆分依据"),
});

export type TurnQueueDecision = z.infer<typeof TurnQueueDecisionSchema>;
