import { z } from "zod";

const PreviewImageSchema = z.object({
  id: z.string().optional(),
  url: z.string(),
  alt: z.string().nullable().optional(),
  prompt: z.string().nullable().optional(),
  taskId: z.string().nullable().optional(),
});

const ScriptSegmentSchema = z.object({
  id: z.string().optional(),
  label: z.string().nullable().optional(),
  body: z.string(),
  durationSec: z.number().nullable().optional(),
});

/** 不含 kind；形态由 profile.direction.format 决定 */
const PreviewContentPayloadSchema = z.object({
  body: z.string().optional(),
  images: z.array(PreviewImageSchema).optional(),
  caption: z.string().nullable().optional(),
  segments: z.array(ScriptSegmentSchema).min(1).optional(),
});

export const RevisePreviewOutputSchema = z.object({
  title: z.string().nullable().optional(),
  hook: z.string().nullable().optional(),
  hashtags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
  content: PreviewContentPayloadSchema,
});

export type RevisePreviewOutput = z.infer<typeof RevisePreviewOutputSchema>;
