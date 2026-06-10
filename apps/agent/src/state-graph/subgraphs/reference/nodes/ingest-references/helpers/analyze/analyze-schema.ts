import { z } from "zod";

export const ReferenceContentAnalyzeSchema = z.object({
  summary: z.string().min(1).describe("参考资源客观内容、风格与结构摘要"),
  keywords: z.array(z.string()).optional(),
  tone_hints: z.array(z.string()).optional(),
  style_hints: z.array(z.string()).optional(),
  structure_hints: z.array(z.string()).optional(),
  transcript: z.string().optional().describe("ASR 转写稿，音频/视频素材"),
  visual_cues: z.string().optional().describe("视觉感知摘要，图片/视频素材"),
});

export type ReferenceContentAnalyzeResult = z.infer<
  typeof ReferenceContentAnalyzeSchema
>;
