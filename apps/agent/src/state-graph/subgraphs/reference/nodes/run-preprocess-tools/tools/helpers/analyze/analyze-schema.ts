import { z } from "zod";

export const ReferenceContentAnalyzeSchema = z.object({
  summary: z.string().min(1).describe("参考资源客观内容、风格与结构摘要"),
  keywords: z.array(z.string()).optional(),
  tone_hints: z.array(z.string()).optional(),
  style_hints: z.array(z.string()).optional(),
  structure_hints: z.array(z.string()).optional(),
  visual_cues: z.string().optional().describe("视觉感知摘要，图片素材"),
});
