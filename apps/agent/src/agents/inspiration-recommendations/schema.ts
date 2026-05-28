/**
 * 灵感推荐子图 structured output schema（新建作品开场白）。
 */
import { z } from "zod";

export const InspirationItemSchema = z.object({
  suggestion: z.string().min(1),
});

export const InspirationRecommendationsResponseSchema = z.object({
  recommendations: z.array(InspirationItemSchema).min(1).max(3),
});

export const InspirationRecommendationSchema = InspirationItemSchema.extend({
  id: z.string(),
});

export type InspirationRecommendation = z.infer<
  typeof InspirationRecommendationSchema
>;
