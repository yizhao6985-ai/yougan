import { z } from "zod";

export const ProductionPlanTaskSchema = z.object({
  description: z.string().min(1).describe("任务描述"),
  department: z
    .enum(["writing", "design", "audio", "video"])
    .describe("负责部门"),
});

export const ProductionPlanResponseSchema = z.object({
  summary: z.string().min(1).describe("制作计划整体摘要"),
  director_notes: z.string().optional().describe("创意总监给制作团队的备注"),
  departments: z
    .array(z.enum(["writing", "design", "audio", "video"]))
    .min(1)
    .describe("本次制作涉及的部门"),
  tasks: z
    .array(ProductionPlanTaskSchema)
    .min(1)
    .describe("具体执行任务列表"),
});

export type ProductionPlanResponse = z.infer<
  typeof ProductionPlanResponseSchema
>;
