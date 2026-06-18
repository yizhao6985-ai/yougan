/** 内部计量：1 microCredit = ¥0.0001（¥1 = 10_000 microCredits） */
export const MICRO_CREDITS_PER_YUAN = 10_000 as const;

export const METERING_MODEL_IDS = [
  "qwen-max",
  "qwen-plus",
  "glm-5.2",
  "qwen-omni-flash",
  "qwen-image-2.0-pro",
  "deepseek-v3",
] as const;

export type MeteringModelId = (typeof METERING_MODEL_IDS)[number];

export type UsageMetadataLike = {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  input_token_details?: {
    cache_read?: number;
  };
};

export type RunMetering = {
  inputTokens: number;
  outputTokens: number;
  microCredits: number;
  callCount: number;
};

export const EMPTY_RUN_METERING: RunMetering = {
  inputTokens: 0,
  outputTokens: 0,
  microCredits: 0,
  callCount: 0,
};
