import { z } from "zod";

export const ConversationSummarySchema = z.object({
  summary: z
    .string()
    .min(1)
    .describe(
      "合并此前摘要与待压缩对话后的滚动摘要，保留创作意图、方案变更、参考素材与出稿相关决策",
    ),
});

export type ConversationSummary = z.infer<typeof ConversationSummarySchema>;
