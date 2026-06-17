import { z } from "zod";

export const ReferenceTurnIntentSchema = z.object({
  reference_id: z.string(),
  summary: z.string().min(1),
  status: z.enum(["confirmed", "pending"]),
});

export const ReferenceTurnSummarySchema = z.object({
  intents: z.array(ReferenceTurnIntentSchema).default([]),
  reply: z.string().min(1).describe("面向感友的确认或追问"),
});
