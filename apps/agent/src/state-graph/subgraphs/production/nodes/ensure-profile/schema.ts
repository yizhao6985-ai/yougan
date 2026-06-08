/** ensureProfile 结构化输出：补全 topic / summary / segments */
import { z } from "zod";

const ProfileSegmentSchema = z.object({
  description: z.string().min(1).describe("结构段描述"),
  role: z.string().nullable().optional().describe("段落角色，如 hook/scene/subject"),
});

export const EnsureProfileResponseSchema = z.object({
  topic: z.string().min(1).describe("创作主题，从用户诉求与已有信息合理推断"),
  summary: z.string().min(1).describe("一句话定位"),
  segments: z.array(ProfileSegmentSchema).min(1).max(8).describe("有序结构段"),
  audience: z.string().nullable().optional().describe("目标受众，可合理默认"),
  tone: z.string().nullable().optional().describe("语气，可合理默认"),
});

export type EnsureProfileResponse = z.infer<typeof EnsureProfileResponseSchema>;
