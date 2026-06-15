import {
  OPENING_NEXT_STEP_SUGGESTIONS_COUNT,
  TURN_NEXT_STEP_SUGGESTIONS_COUNT,
} from "@yougan/domain";
import { z } from "zod";

export {
  OPENING_NEXT_STEP_SUGGESTIONS_COUNT,
  TURN_NEXT_STEP_SUGGESTIONS_COUNT,
} from "@yougan/domain";

export const NextStepSuggestionItemSchema = z.object({
  message: z
    .string()
    .describe("用户点击后原样发送的完整口语化中文，一句说清意图"),
});

export function nextStepSuggestionsResponseSchema(count: number) {
  return z.object({
    hint: z.string().optional(),
    suggestions: z
      .array(NextStepSuggestionItemSchema)
      .length(count)
      .describe(`恰好 ${count} 条可点击下一步建议`),
  });
}
