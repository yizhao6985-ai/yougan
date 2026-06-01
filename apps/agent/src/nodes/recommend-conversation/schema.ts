/** 新对话空 thread 开场推荐 schema */
import { z } from "zod";

import { BriefSuggestionSchema } from "../inspiration/nodes/generate-suggestions.schema.js";

export const CONVERSATION_RECOMMENDATIONS_COUNT = 3;

export const ConversationRecommendationsResponseSchema = z.object({
  hint: z.string().optional().describe("建议区提示语"),
  suggestions: z
    .array(BriefSuggestionSchema)
    .length(CONVERSATION_RECOMMENDATIONS_COUNT)
    .describe("恰好 3 条可点击开场建议"),
});

export type ConversationRecommendationsResponse = z.infer<
  typeof ConversationRecommendationsResponseSchema
>;
