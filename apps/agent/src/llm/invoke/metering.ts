/**
 * LLM 调用计量：按 thread_id 聚合；节点结束时刷入 aiUsage.settledMicroCredits。
 * Agent 调用结束或取消时由 API proxy 将 checkpoint 与 DB 对齐入账。
 */
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { AIMessage } from "@langchain/core/messages";
import type { ChatGeneration, LLMResult } from "@langchain/core/outputs";
import { mergeConfigs, type RunnableConfig } from "@langchain/core/runnables";
import {
  buildRunMeteringDelta,
  isUsageExceeded,
  mergeRunMetering,
  toUsagePercent,
  type AiUsageSnapshot,
  type MeteringModelId,
  type RunMetering,
  type UsageMetadataLike,
  EMPTY_RUN_METERING,
} from "@yougan/domain";

type MeteringConfigurable = {
  __runMeteringAcc?: RunMetering;
};

const accByThreadId = new Map<string, RunMetering>();
const lastFlushedAccByThreadId = new Map<string, RunMetering>();

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

function meteringDeltaSince(
  current: RunMetering,
  previous: RunMetering,
): RunMetering {
  return {
    inputTokens: Math.max(0, current.inputTokens - previous.inputTokens),
    outputTokens: Math.max(0, current.outputTokens - previous.outputTokens),
    microCredits: Math.max(0, current.microCredits - previous.microCredits),
    callCount: Math.max(0, current.callCount - previous.callCount),
  };
}

function getLastFlushedAcc(config?: RunnableConfig): RunMetering {
  const threadId = resolveThreadId(config);
  if (threadId) {
    return lastFlushedAccByThreadId.get(threadId) ?? EMPTY_RUN_METERING;
  }
  return EMPTY_RUN_METERING;
}

function setLastFlushedAcc(
  config: RunnableConfig | undefined,
  acc: RunMetering,
): void {
  const threadId = resolveThreadId(config);
  if (threadId) {
    lastFlushedAccByThreadId.set(threadId, { ...acc });
  }
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
    lastFlushedAccByThreadId.delete(threadId);
  }

  const configurable = ensureMeteringConfigurable(config);
  configurable.__runMeteringAcc = { ...EMPTY_RUN_METERING };
}

export function flushRunMeteringAccumulator(
  config?: RunnableConfig,
): RunMetering {
  return { ...getRunMeteringAccumulator(config) };
}

/** 将本节点新增计量累加到 aiUsage.settledMicroCredits */
export function patchAiUsageMetering(
  base: AiUsageSnapshot | undefined,
  config?: RunnableConfig,
): { aiUsage: AiUsageSnapshot } | Record<string, never> {
  if (!base) return {};

  const acc = { ...getRunMeteringAccumulator(config) };
  const delta = meteringDeltaSince(acc, getLastFlushedAcc(config));
  setLastFlushedAcc(config, acc);

  if (delta.microCredits <= 0 && delta.callCount <= 0) {
    return {
      aiUsage: {
        ...base,
        usagePercent: toUsagePercent(
          base.settledMicroCredits,
          base.quotaMicroCredits,
        ),
        usageExceeded: isUsageExceeded(
          base.settledMicroCredits,
          base.quotaMicroCredits,
        ),
      },
    };
  }

  const settledMicroCredits = base.settledMicroCredits + delta.microCredits;

  return {
    aiUsage: {
      ...base,
      settledMicroCredits,
      usagePercent: toUsagePercent(settledMicroCredits, base.quotaMicroCredits),
      usageExceeded: isUsageExceeded(
        settledMicroCredits,
        base.quotaMicroCredits,
      ),
    },
  };
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

import { resolveDashScopeMeteringModelId as resolveDashScopeMeteringModelIdFromConfig } from "#agent/llm/providers/dashscope-chat-config.js";

export { resolveDashScopeMeteringModelIdFromConfig as resolveDashScopeMeteringModelId };
