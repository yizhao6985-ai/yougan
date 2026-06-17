import { z } from "zod";

export const DesignDeliverablePayloadSchema = z.object({
  body: z
    .string()
    .min(1)
    .describe(
      "可直接交给 renderDesignImage / image-01 的文生图 prompt（含主体、构图、风格、色彩）",
    ),
  title: z.string().nullable().optional().describe("画面标题建议"),
  notes: z
    .string()
    .nullable()
    .optional()
    .describe("给用户的短说明（1–3 句），整合阶段写入 preview.body"),
  negative_prompt: z
    .string()
    .nullable()
    .optional()
    .describe("可选负面 prompt，出图时使用"),
});

export type DesignDeliverablePayload = z.infer<
  typeof DesignDeliverablePayloadSchema
>;
