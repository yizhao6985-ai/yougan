import type { RunMetering, UsageMetadataLike } from "./types.js";
import { EMPTY_RUN_METERING } from "./types.js";
import {
  computeMicroCreditsFromUsage,
} from "./pricing.js";
import type { MeteringModelId } from "./types.js";

export function mergeRunMetering(
  prev: RunMetering,
  next: Partial<RunMetering> | RunMetering,
): RunMetering {
  return {
    inputTokens: prev.inputTokens + (next.inputTokens ?? 0),
    outputTokens: prev.outputTokens + (next.outputTokens ?? 0),
    microCredits: prev.microCredits + (next.microCredits ?? 0),
    callCount: prev.callCount + (next.callCount ?? 0),
  };
}

export function buildRunMeteringDelta(
  modelId: MeteringModelId,
  usage: UsageMetadataLike | undefined,
  microCreditsOverride?: number,
): RunMetering {
  const inputTokens = usage?.input_tokens ?? 0;
  const outputTokens = usage?.output_tokens ?? 0;
  const microCredits =
    microCreditsOverride ?? computeMicroCreditsFromUsage(modelId, usage);
  if (microCredits <= 0 && inputTokens <= 0 && outputTokens <= 0) {
    return { ...EMPTY_RUN_METERING };
  }
  return {
    inputTokens,
    outputTokens,
    microCredits,
    callCount: microCredits > 0 || inputTokens > 0 || outputTokens > 0 ? 1 : 0,
  };
}

export function toUsagePercent(usageMicroCredits: number, quotaMicroCredits: number): number {
  if (quotaMicroCredits <= 0) return 0;
  return Math.min(
    100,
    Math.round((usageMicroCredits / quotaMicroCredits) * 100),
  );
}

export function isUsageExceeded(usageMicroCredits: number, quotaMicroCredits: number): boolean {
  return quotaMicroCredits > 0 && usageMicroCredits >= quotaMicroCredits;
}
