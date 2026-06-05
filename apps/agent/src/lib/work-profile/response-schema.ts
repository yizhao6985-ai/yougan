/** ensureProfile 等结构化输出共用的节拍 schema */
import { z } from "zod";

export const ProfileBeatSchema = z.object({
  description: z.string().min(1).describe("内容节拍描述"),
  intent: z.string().nullable().optional().describe("本节意图，如钩子/转化"),
});
