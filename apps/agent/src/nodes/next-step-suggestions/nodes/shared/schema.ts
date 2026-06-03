import { MAX_NEXT_STEP_SUGGESTION_LENGTH } from "@yougan/domain";
import { z } from "zod";

/** 回合末下一步建议条数 */
export const TURN_NEXT_STEP_SUGGESTIONS_COUNT = 4;

/** 开屏选题建议条数 */
export const OPENING_TOPIC_SUGGESTIONS_COUNT = 7;

export const NextStepSuggestionItemSchema = z.object({
  kind: z.enum(["explore", "confirm", "navigate"]),
  label: z.string(),
  message: z
    .string()
    .describe(
      `用户点击后发送的完整口语化中文，不超过 ${MAX_NEXT_STEP_SUGGESTION_LENGTH} 字`,
    ),
});

export const TurnNextStepSuggestionsResponseSchema = z.object({
  hint: z.string().optional(),
  suggestions: z.array(NextStepSuggestionItemSchema),
});

export const OpeningTopicSuggestionsResponseSchema = z.object({
  hint: z.string().optional().describe("建议区提示语"),
  suggestions: z
    .array(NextStepSuggestionItemSchema)
    .length(OPENING_TOPIC_SUGGESTIONS_COUNT)
    .describe("恰好 7 条可点击选题建议"),
});
