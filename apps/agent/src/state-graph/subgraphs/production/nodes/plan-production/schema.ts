/** planProduction LLM 结构化输出 schema */
import { z } from "zod";

export const PlanTaskSchema = z.object({
  description: z.string().min(1).describe(
    "节级执行任务：撰写某一内容节点的正文/脚本（如「撰写开篇 hook 正文」）。禁止大纲、策划、结构梳理等 meta 描述",
  ),
  department: z
    .enum(["writing", "video"])
    .describe("负责部门：writing=文案；video=脚本/分镜文案"),
  direction: z
    .string()
    .min(1)
    .describe(
      "该节的规划 brief：本节写什么、如何呼应 profile 与结构段（不是正文、不是实现细节）。连续正文时须含【本节止于】；第 2 节起另含【下节起笔】【禁止重复】（段首勿复述上节末尾 beat，非禁止元素复现）",
    ),
  acceptance_criteria: z
    .string()
    .min(1)
    .describe(
      "方向性验收标准：本节产出是否契合作品方案与该节目标",
    ),
});

export const PlanResponseSchema = z.object({
  tasks: z
    .array(PlanTaskSchema)
    .min(1)
    .describe(
      "可执行任务列表，按成稿顺序排列；每条对应一个内容节点，可直接交给 executeWriting 产出 deliverable。用户若限定范围（如「只写第一节拍」），列表只含该范围内的 tasks，勿扩写全篇",
    ),
});

export type PlanResponse = z.infer<typeof PlanResponseSchema>;
