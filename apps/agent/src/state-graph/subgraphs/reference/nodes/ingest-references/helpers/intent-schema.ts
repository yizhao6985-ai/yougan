import { z } from "zod";

export const PENDING_REFERENCE_INTENT_SUMMARY =
  "待确认：请说明希望借鉴的风格、结构或语气";

export const ReferenceIntentSummarizeSchema = z.object({
  summary: z
    .string()
    .min(1)
    .describe("1–2 句归纳如何借鉴该参考；禁止复述用户原话"),
  status: z
    .enum(["confirmed", "pending"])
    .describe("confirmed=用户已说明用途；pending=尚待用户确认借鉴方向"),
});

export type ReferenceIntentSummarizeResult = z.infer<
  typeof ReferenceIntentSummarizeSchema
>;
