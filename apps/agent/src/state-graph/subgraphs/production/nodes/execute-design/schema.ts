import { z } from "zod";

export const DesignDeliverablePayloadSchema = z.object({
  body: z
    .string()
    .min(1)
    .describe(
      "文生图 prompt：肯定句描述主体/场景/风格/光线/色彩；满幅构图；末尾附一行肯定句构图约束（如「满幅构图，画面干净，主体铺满画布」）。默认不写角标、水印、黑边、宽银幕遮幅、电影感等装饰性词汇，除非用户明确要求",
    ),
  title: z.string().nullable().optional().describe("画面标题建议"),
  notes: z
    .string()
    .nullable()
    .optional()
    .describe("给用户的短说明（1–3 句），整合为 text block"),
  negative_prompt: z
    .string()
    .nullable()
    .optional()
    .describe("留空；出图节点不使用负面词"),
});

export type DesignDeliverablePayload = z.infer<
  typeof DesignDeliverablePayloadSchema
>;
