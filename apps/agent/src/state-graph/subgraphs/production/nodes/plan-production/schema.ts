/** planProduction LLM 结构化输出 schema */
import { z } from "zod";

export const PlanTaskSchema = z.object({
  description: z.string().min(1).describe("任务描述（做什么）"),
  department: z
    .enum(["writing", "design", "audio", "video"])
    .describe("负责部门"),
  direction: z
    .string()
    .min(1)
    .describe(
      "总监方向指导：基于 profile 说明该任务产出应体现的风格、结构、受众呼应等（不是实现细节）",
    ),
  acceptance_criteria: z
    .string()
    .min(1)
    .describe(
      "方向性验收标准：验收员据此判断产出是否契合作品方案与该任务目标",
    ),
});

export const PlanResponseSchema = z.object({
  summary: z
    .string()
    .min(1)
    .describe("制作计划整体摘要（含编排说明与给制作团队的备注）"),
  tasks: z.array(PlanTaskSchema).min(1).describe("具体执行任务列表"),
});

export type PlanResponse = z.infer<typeof PlanResponseSchema>;
