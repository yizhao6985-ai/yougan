/**
 * 大纲 agent structured output：内容结构，不含部门任务。
 */
import { z } from "zod";

export const OutlineSectionSchema = z.object({
  description: z.string().min(1).describe("大纲条目，描述内容的一节或一块"),
});

export const OutlineResponseSchema = z.object({
  summary: z.string().min(1).describe("大纲整体摘要"),
  sections: z
    .array(OutlineSectionSchema)
    .min(1)
    .describe("内容大纲条目列表"),
});

export type OutlineResponse = z.infer<typeof OutlineResponseSchema>;
