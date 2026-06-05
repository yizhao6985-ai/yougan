import { z } from "zod";

import { MAX_CONVERSATION_TITLE_LENGTH, TURN_QUEUE_KINDS } from "@yougan/domain";

export const TurnQueueDecisionSchema = z.object({
  kinds: z
    .array(z.enum(TURN_QUEUE_KINDS))
    .min(1)
    .max(8)
    .describe(
      "本轮按顺序执行的对话子图队列。例：改方案+出稿 → blueprint, creation；改宾语是成稿 → creation；改宾语是方案 → blueprint",
    ),
  reason: z.string().describe("一句话说明队列拆分依据"),
  conversationTitle: z
    .string()
    .min(2)
    .max(MAX_CONVERSATION_TITLE_LENGTH)
    .optional()
    .describe(
      `仅当需要自动命名时填写：用不超过 ${MAX_CONVERSATION_TITLE_LENGTH} 字的中文短语概括用户最新消息主题；不要引号、不要含「对话」字样`,
    ),
});

export type TurnQueueDecision = z.infer<typeof TurnQueueDecisionSchema>;
