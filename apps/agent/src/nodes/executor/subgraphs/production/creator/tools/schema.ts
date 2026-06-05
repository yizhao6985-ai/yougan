/** generate_draft 等 structured output 的 preview payload */
import { z } from "zod";

export const WorkPreviewPayloadSchema = z.object({
  title: z.string().nullable().optional(),
  body: z.string().min(1),
  hashtags: z.array(z.string()).optional(),
  hook: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type WorkPreviewPayload = z.infer<typeof WorkPreviewPayloadSchema>;
