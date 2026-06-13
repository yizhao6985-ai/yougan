/**
 * LLM 调用计量：写入 config.configurable.__runMeteringAcc，由 summarizeMessages 刷入 state。
 */
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { AIMessage } from "@langchain/core/messages";
import type { ChatGeneration, LLMResult } from "@langchain/core/outputs";
import { mergeConfigs, type RunnableConfig } from "@langchain/core/runnables";
import {
  buildRunMeteringDelta,
  mergeRunMetering,
  type MeteringModelId,
  type RunMetering,
  type UsageMetadataLike,
  EMPTY_RUN_METERING,
} from "@yougan/domain";

type MeteringConfigurable = {
  __runMeteringAcc?: RunMetering;
};

function ensureMeteringConfigurable(
  config?: RunnableConfig,
): MeteringConfigurable {
  if (!config) return {};
  config.configurable ??= {};
  return config.configurable as MeteringConfigurable;
}

export function getRunMeteringAccumulator(
  config?: RunnableConfig,
): RunMetering {
  const configurable = ensureMeteringConfigurable(config);
  configurable.__runMeteringAcc ??= { ...EMPTY_RUN_METERING };
  return configurable.__runMeteringAcc;
}

export function recordRunMeteringUsage(
  config: RunnableConfig | undefined,
  modelId: MeteringModelId,
  usage: UsageMetadataLike | undefined,
  microCreditsOverride?: number,
): void {
  const delta = buildRunMeteringDelta(modelId, usage, microCreditsOverride);
  if (delta.callCount === 0 && delta.microCredits === 0) return;

  const acc = getRunMeteringAccumulator(config);
  const merged = mergeRunMetering(acc, delta);
  Object.assign(acc, merged);
}

export function resetRunMeteringAccumulator(config?: RunnableConfig): void {
  const configurable = ensureMeteringConfigurable(config);
  configurable.__runMeteringAcc = { ...EMPTY_RUN_METERING };
}

export function flushRunMeteringAccumulator(
  config?: RunnableConfig,
): RunMetering {
  return { ...getRunMeteringAccumulator(config) };
}

function extractUsageFromLlmResult(
  output: LLMResult,
): UsageMetadataLike | undefined {
  const generation = output.generations?.[0]?.[0];
  if (generation && "message" in generation) {
    const message = (generation as ChatGeneration).message;
    if (message instanceof AIMessage && message.usage_metadata) {
      return message.usage_metadata;
    }
  }

  const tokenUsage = output.llmOutput?.tokenUsage as
    | {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
      }
    | undefined;
  if (!tokenUsage) return undefined;

  return {
    input_tokens: tokenUsage.promptTokens,
    output_tokens: tokenUsage.completionTokens,
    total_tokens: tokenUsage.totalTokens,
  };
}

export class LlmMeteringHandler extends BaseCallbackHandler {
  name = "yougan_llm_metering";

  constructor(
    private readonly modelId: MeteringModelId,
    private readonly config?: RunnableConfig,
  ) {
    super();
  }

  handleLLMEnd(output: LLMResult): void {
    recordRunMeteringUsage(
      this.config,
      this.modelId,
      extractUsageFromLlmResult(output),
    );
  }
}

export function withMeteringCallbacks(
  config: RunnableConfig | undefined,
  modelId: MeteringModelId,
): RunnableConfig {
  const handler = new LlmMeteringHandler(modelId, config);
  return mergeConfigs(config ?? {}, { callbacks: [handler] }) as RunnableConfig;
}

/** 将 env 模型名映射到计量单价表 */
export function resolveQwenMeteringModelId(modelName: string): MeteringModelId {
  const normalized = modelName.toLowerCase();
  if (normalized.includes("plus")) return "qwen-plus";
  return "qwen-max";
}

export function resolveMinimaxMeteringModelId(
  _modelName: string,
): MeteringModelId {
  return "minimax-m3-s";
}
