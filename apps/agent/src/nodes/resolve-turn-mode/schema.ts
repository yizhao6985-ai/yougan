import { z } from "zod";

export const TurnModeDecisionSchema = z.object({
  mode: z
    .enum(["inspiration", "creation", "ask"])
    .describe(
      "inspiration=对齐方向/管理 brief；creation=按计划出稿或改稿；ask=答疑/建议/分析，不改 brief 不出稿",
    ),
  reason: z.string().describe("一句话说明判断依据"),
});

export type TurnModeDecision = z.infer<typeof TurnModeDecisionSchema>;
