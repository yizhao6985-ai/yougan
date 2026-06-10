import { z } from "zod";

export const ReferenceTargetSchema = z.object({
  reference_id: z.string().optional(),
  index: z.number().int().min(0).optional(),
  asset_url: z.string().optional(),
});

export const ReferenceIntentUpdatePlanSchema = ReferenceTargetSchema.extend({
  user_context: z
    .string()
    .min(1)
    .describe("感友关于如何借鉴该条参考的原话"),
});

export const ReferencePatchSchema = z.object({
  deletes: z.array(ReferenceTargetSchema).default([]),
  intent_updates: z.array(ReferenceIntentUpdatePlanSchema).default([]),
  global_user_context: z
    .string()
    .optional()
    .describe("未指定条目时，对所有 pending 参考的统一借鉴说明"),
});

export type ReferencePatch = z.infer<typeof ReferencePatchSchema>;
