/**
 * 大纲模式 structured output schema（灵感 → 大纲同步）。
 */
import { z } from "zod";

export const OutlineItemSchema = z.object({
  description: z.string().min(1),
  source: z.string().optional(),
});

export const OutlineSyncResultSchema = z.object({
  implemented: z.array(OutlineItemSchema),
  pending: z.array(OutlineItemSchema),
  outline_summary: z.string().optional(),
});

export type OutlineItem = z.infer<typeof OutlineItemSchema>;
export type OutlineSyncResult = z.infer<typeof OutlineSyncResultSchema>;
