import {
  MICRO_CREDITS_PER_YUAN,
  type MeteringModelId,
  type UsageMetadataLike,
} from "./types.js";

/** 元/百万 tokens → microCredits/百万 tokens */
export type ModelPriceTable = {
  inputMicroCreditsPer1M: number;
  outputMicroCreditsPer1M: number;
  cachedInputMicroCreditsPer1M?: number;
  flatMicroCreditsPerCall?: number;
};

/** 与百炼 / DeepSeek / MiniMax 官方价对齐（2026 Q1） */
export const MODEL_PRICE_TABLE: Record<MeteringModelId, ModelPriceTable> = {
  "qwen-max": {
    inputMicroCreditsPer1M: 2.4 * MICRO_CREDITS_PER_YUAN,
    outputMicroCreditsPer1M: 9.6 * MICRO_CREDITS_PER_YUAN,
  },
  "qwen-plus": {
    inputMicroCreditsPer1M: 0.8 * MICRO_CREDITS_PER_YUAN,
    outputMicroCreditsPer1M: 2.0 * MICRO_CREDITS_PER_YUAN,
  },
  "deepseek-v3": {
    inputMicroCreditsPer1M: 2.0 * MICRO_CREDITS_PER_YUAN,
    outputMicroCreditsPer1M: 8.0 * MICRO_CREDITS_PER_YUAN,
    cachedInputMicroCreditsPer1M: 0.5 * MICRO_CREDITS_PER_YUAN,
  },
  "minimax-m3-s": {
    inputMicroCreditsPer1M: 2.1 * MICRO_CREDITS_PER_YUAN,
    outputMicroCreditsPer1M: 8.4 * MICRO_CREDITS_PER_YUAN,
    cachedInputMicroCreditsPer1M: 0.42 * MICRO_CREDITS_PER_YUAN,
  },
  "dashscope-image": {
    inputMicroCreditsPer1M: 0,
    outputMicroCreditsPer1M: 0,
    flatMicroCreditsPerCall: 0.4 * MICRO_CREDITS_PER_YUAN,
  },
};

function tokensToMicroCredits(tokens: number, microCreditsPer1M: number): number {
  if (tokens <= 0 || microCreditsPer1M <= 0) return 0;
  return Math.ceil((tokens * microCreditsPer1M) / 1_000_000);
}

export function computeMicroCreditsFromUsage(
  modelId: MeteringModelId,
  usage: UsageMetadataLike | undefined,
): number {
  const table = MODEL_PRICE_TABLE[modelId];
  if (table.flatMicroCreditsPerCall != null && table.flatMicroCreditsPerCall > 0) {
    return table.flatMicroCreditsPerCall;
  }
  if (!usage) return 0;

  const inputTokens = usage.input_tokens ?? 0;
  const outputTokens = usage.output_tokens ?? 0;
  const cacheRead = usage.input_token_details?.cache_read ?? 0;
  const uncachedInput = Math.max(0, inputTokens - cacheRead);

  let total = 0;
  total += tokensToMicroCredits(uncachedInput, table.inputMicroCreditsPer1M);
  total += tokensToMicroCredits(outputTokens, table.outputMicroCreditsPer1M);
  if (cacheRead > 0 && table.cachedInputMicroCreditsPer1M != null) {
    total += tokensToMicroCredits(cacheRead, table.cachedInputMicroCreditsPer1M);
  }
  return total;
}

export function computeFlatMicroCredits(modelId: MeteringModelId): number {
  return MODEL_PRICE_TABLE[modelId].flatMicroCreditsPerCall ?? 0;
}
