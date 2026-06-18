import type { AiUsageSnapshot } from "../../models/agent/ai-usage.js";
import { isUsageExceeded, toUsagePercent } from "./aggregate.js";

export function buildAiUsageSnapshot(input: {
  planId: string;
  quotaMicroCredits: number;
  settledMicroCredits: number;
}): AiUsageSnapshot {
  const settledMicroCredits = Math.max(0, input.settledMicroCredits);
  const usagePercent = toUsagePercent(
    settledMicroCredits,
    input.quotaMicroCredits,
  );

  return {
    planId: input.planId,
    quotaMicroCredits: input.quotaMicroCredits,
    settledMicroCredits,
    usagePercent,
    usageExceeded: isUsageExceeded(
      settledMicroCredits,
      input.quotaMicroCredits,
    ),
  };
}
