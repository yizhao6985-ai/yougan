import { z } from "zod";

export const ConsolidatedPreviewSchema = z.object({
  title: z.string().nullable().optional(),
  body: z.string().min(1),
  hashtags: z.array(z.string()).optional(),
  hook: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type ConsolidatedPreview = z.infer<typeof ConsolidatedPreviewSchema>;
