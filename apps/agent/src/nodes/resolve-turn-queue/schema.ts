import { z } from "zod";

import { TURN_TASK_KINDS } from "@yougan/domain";

export const TurnQueueDecisionSchema = z.object({
  tasks: z
    .array(z.enum(TURN_TASK_KINDS))
    .min(1)
    .max(8)
    .describe(
      "本轮按顺序执行的任务队列。例：上传参考图+记需求+改大纲 → references, brief, outline_patch",
    ),
  reason: z.string().describe("一句话说明任务拆分依据"),
});

export type TurnQueueDecision = z.infer<typeof TurnQueueDecisionSchema>;
