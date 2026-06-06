import { z } from "zod";

export const ReferenceImageParseSchema = z.object({
  summary: z.string().min(1).describe("参考图的风格、构图、色调描述"),
  tone_hints: z.array(z.string()).optional(),
  structure_hints: z.array(z.string()).optional(),
});

export type ReferenceImageParse = z.infer<typeof ReferenceImageParseSchema>;
