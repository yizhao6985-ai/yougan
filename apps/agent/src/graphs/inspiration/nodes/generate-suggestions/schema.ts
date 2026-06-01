/** 灵感模式结构化建议 schema */
import { z } from "zod";

export const INSPIRATION_SUGGESTIONS_COUNT = 4;

export const InspirationSuggestionSchema = z.object({
  kind: z
    .enum(["explore", "confirm", "navigate"])
    .describe(
      "explore=继续探索需求；confirm=确认某条灵感；navigate=切换模式或进入下一步",
    ),
  label: z.string().min(1).max(24).describe("按钮短标签，6 字以内为佳"),
  message: z
    .string()
    .min(1)
    .describe("用户点击后发送到对话的完整句子"),
});

export const InspirationSuggestionsResponseSchema = z.object({
  hint: z.string().optional().describe("建议区提示语"),
  suggestions: z
    .array(InspirationSuggestionSchema)
    .min(2)
    .max(6)
    .describe("2-6 条可点击建议"),
});

export type InspirationSuggestionsResponse = z.infer<
  typeof InspirationSuggestionsResponseSchema
>;
