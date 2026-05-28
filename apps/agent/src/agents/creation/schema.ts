/**
 * 创作模式 structured output schema（generate_content 工具）。
 */
import { z } from "zod";

export const GeneratedContentPayloadSchema = z.object({
  title: z.string().nullable().optional(),
  body: z.string().min(1),
  hashtags: z.array(z.string()).optional(),
  hook: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type GeneratedContentPayload = z.infer<
  typeof GeneratedContentPayloadSchema
>;
