/**
 * LLM 调用计量：按 thread_id 聚合并写入 __runMeteringAcc，由 finalizeRunMetering 刷入 state。
 * 子图与主图的 RunnableConfig 不是同一对象，但 configurable.thread_id 相同。
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

/** 子图 / 浅拷贝 config 不共享 configurable 引用时，仍可按 thread 聚合 */
const accByThreadId = new Map<string, RunMetering>();

function resolveThreadId(config?: RunnableConfig): string | undefined {
  const threadId = config?.configurable?.thread_id;
  return typeof threadId === "string" && threadId.length > 0
    ? threadId
    : undefined;
}

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
  const threadId = resolveThreadId(config);
  if (threadId) {
    let acc = accByThreadId.get(threadId);
    if (!acc) {
      acc = { ...EMPTY_RUN_METERING };
      accByThreadId.set(threadId, acc);
    }
    return acc;
  }

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

/** callback 未写入时，用 message.usage_metadata 等来源补记 */
export function recordRunMeteringUsageIfMissing(
  config: RunnableConfig | undefined,
  modelId: MeteringModelId,
  usage: UsageMetadataLike | undefined,
): void {
  if (!usage) return;
  recordRunMeteringUsage(config, modelId, usage);
}

export function resetRunMeteringAccumulator(config?: RunnableConfig): void {
  const threadId = resolveThreadId(config);
  if (threadId) {
    accByThreadId.set(threadId, { ...EMPTY_RUN_METERING });
    return;
  }

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
  if (tokenUsage) {
    return {
      input_tokens: tokenUsage.promptTokens,
      output_tokens: tokenUsage.completionTokens,
      total_tokens: tokenUsage.totalTokens,
    };
  }

  const usage = output.llmOutput?.usage as
    | {
        prompt_tokens?: number;
        completion_tokens?: number;
        input_tokens?: number;
        output_tokens?: number;
        total_tokens?: number;
      }
    | undefined;
  if (!usage) return undefined;

  return {
    input_tokens: usage.prompt_tokens ?? usage.input_tokens,
    output_tokens: usage.completion_tokens ?? usage.output_tokens,
    total_tokens: usage.total_tokens,
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
  accumulatorConfig?: RunnableConfig,
): RunnableConfig {
  const handler = new LlmMeteringHandler(modelId, accumulatorConfig ?? config);
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
