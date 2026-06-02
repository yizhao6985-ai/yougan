import { z } from "zod";

export const BRIEF_SUGGESTIONS_COUNT = 4;

export const CONVERSATION_RECOMMENDATIONS_COUNT = 3;

export const BriefSuggestionItemSchema = z.object({
  kind: z.enum(["explore", "confirm", "navigate"]),
  label: z.string(),
  message: z.string(),
});

export const BriefSuggestionsResponseSchema = z.object({
  hint: z.string().optional(),
  suggestions: z.array(BriefSuggestionItemSchema),
});

export const ConversationRecommendationsResponseSchema = z.object({
  hint: z.string().optional().describe("建议区提示语"),
  suggestions: z
    .array(BriefSuggestionItemSchema)
    .length(CONVERSATION_RECOMMENDATIONS_COUNT)
    .describe("恰好 3 条可点击开场建议"),
});
