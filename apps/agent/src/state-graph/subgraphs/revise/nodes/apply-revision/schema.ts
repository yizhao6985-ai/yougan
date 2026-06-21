import { z } from "zod";

const TextBlockSchema = z.object({
  id: z.string(),
  type: z.literal("text"),
  markdown: z.string(),
  taskId: z.string().nullable().optional(),
});

const ImageBlockSchema = z.object({
  id: z.string(),
  type: z.literal("image"),
  url: z.string(),
  alt: z.string().nullable().optional(),
  prompt: z.string().nullable().optional(),
  taskId: z.string().nullable().optional(),
});

export const RevisePreviewOutputSchema = z.object({
  title: z.string().nullable().optional(),
  hook: z.string().nullable().optional(),
  hashtags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
  blocks: z.array(z.union([TextBlockSchema, ImageBlockSchema])).min(1),
});

export type RevisePreviewOutput = z.infer<typeof RevisePreviewOutputSchema>;
