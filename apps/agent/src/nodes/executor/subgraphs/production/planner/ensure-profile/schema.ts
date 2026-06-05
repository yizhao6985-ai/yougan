import { z } from "zod";

import { ProfileBeatSchema } from "#agent/lib/work-profile/response-schema.js";

export const EnsureProfileResponseSchema = z.object({
  content_topic: z.string().min(1).describe("创作主题，从用户诉求与已有信息合理推断"),
  premise: z.string().min(1).describe("作品方案一句话定位"),
  beats: z.array(ProfileBeatSchema).min(1).max(8).describe("有序内容节拍"),
  audience: z.string().nullable().optional().describe("目标受众，可合理默认"),
  tone: z.string().nullable().optional().describe("语气，可合理默认"),
});
