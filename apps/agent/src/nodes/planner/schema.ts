import { z } from "zod";

import { TURN_QUEUE_KINDS } from "@yougan/domain";

export const TurnQueueDecisionSchema = z.object({
  kinds: z
    .array(z.enum(TURN_QUEUE_KINDS))
    .min(1)
    .max(8)
    .describe(
      "本轮按顺序执行的对话子图队列。例：改方案+出稿 → profile, production；改宾语是成稿 → production；改宾语是方案 → profile",
    ),
  reason: z.string().describe("一句话说明队列拆分依据"),
});

export type TurnQueueDecision = z.infer<typeof TurnQueueDecisionSchema>;
