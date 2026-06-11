import { z } from "zod";

export const ProfileTurnSummarySchema = z.object({
  reply: z
    .string()
    .min(1)
    .describe("面向感友的方案变更确认与引导，不给新建议"),
});

export type ProfileTurnSummary = z.infer<typeof ProfileTurnSummarySchema>;
