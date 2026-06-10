import { z } from "zod";

/** 开屏下一步建议条数 */
export const OPENING_NEXT_STEP_SUGGESTIONS_COUNT = 7;

/** 回合末下一步建议条数 */
export const TURN_NEXT_STEP_SUGGESTIONS_COUNT = 4;

export const NextStepSuggestionItemSchema = z.object({
  kind: z.enum(["explore", "confirm", "navigate"]),
  label: z.string(),
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
