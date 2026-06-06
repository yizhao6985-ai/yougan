import { z } from "zod";

export const ReferenceTextParseSchema = z.object({
  summary: z.string().min(1).describe("参考文案的结构、语气与要点摘要"),
  keywords: z.array(z.string()).optional(),
  tone_hints: z.array(z.string()).optional(),
  structure_hints: z.array(z.string()).optional(),
});

export type ReferenceTextParse = z.infer<typeof ReferenceTextParseSchema>;
