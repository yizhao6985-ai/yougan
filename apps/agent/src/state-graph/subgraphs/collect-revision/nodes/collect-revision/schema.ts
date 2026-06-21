import { z } from "zod";

export const CollectRevisionSchema = z.object({
  instruction: z.string().describe("改稿要求，简洁明确"),
  quote: z
    .string()
    .nullable()
    .optional()
    .describe("用户引用的原文片段，若有"),
});

export type CollectRevisionOutput = z.infer<typeof CollectRevisionSchema>;
