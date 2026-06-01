/**
 * 制作节点 structured output schema：成稿 payload。
 */
import { z } from "zod";

export const WorkDraftPayloadSchema = z.object({
  title: z.string().nullable().optional(),
  body: z.string().min(1),
  hashtags: z.array(z.string()).optional(),
  hook: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type WorkDraftPayload = z.infer<typeof WorkDraftPayloadSchema>;
