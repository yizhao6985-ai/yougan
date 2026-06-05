/**
 * 全量生成/修订 blueprint beats 时的 structured output。
 */
import { z } from "zod";

export const BlueprintBeatSchema = z.object({
  description: z.string().min(1).describe("内容节拍描述"),
  intent: z.string().nullable().optional().describe("本节意图，如钩子/转化"),
});

export const BlueprintResponseSchema = z.object({
  premise: z.string().min(1).describe("作品方案一句话定位"),
  beats: z.array(BlueprintBeatSchema).min(1).describe("有序内容节拍"),
});

export type BlueprintResponse = z.infer<typeof BlueprintResponseSchema>;
