import { z } from "zod";

export const TaskDeliverablePayloadSchema = z.object({
  body: z.string().min(1).describe("该任务的专业交付物正文"),
  title: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type TaskDeliverablePayload = z.infer<typeof TaskDeliverablePayloadSchema>;
