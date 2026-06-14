/**
 * Qwen（百炼 DashScope OpenAI 兼容）Chat 模型。
 */
import { env } from "#agent/env.js";
import {
  createOpenAiCompatibleChatModel,
  type OpenAiCompatibleChatModelOptions,
} from "./openai-compatible.js";

function assertDashScopeApiKey(): void {
  if (!env.dashscopeApiKey) {
    throw new Error("DASHSCOPE_API_KEY_MISSING");
  }
}

const QWEN_CHAT_KWARGS = {
  enable_thinking: false,
  incremental_output: true,
  /** 流式最后一包带上 usage，供 LLM callback / usage_metadata 计量 */
  stream_options: { include_usage: true },
} as const;

/** 对话、结构化 work 等文本任务（计划/验收/建议等，默认较短输出）。 */
export function createChatModel(options?: OpenAiCompatibleChatModelOptions) {
  assertDashScopeApiKey();

  return createOpenAiCompatibleChatModel(
    {
      apiKey: env.dashscopeApiKey,
      baseURL: env.dashscopeBaseUrl,
      model: env.dashscopeModel,
      temperature: env.llmTemperature,
      streaming: true,
      maxTokens: env.llmMaxTokens,
      modelKwargs: QWEN_CHAT_KWARGS,
    },
    options,
  );
}

/** 制作子图：单任务产出与 assemble 整合，允许更长 completion。 */
export function createProductionChatModel(
  options?: OpenAiCompatibleChatModelOptions,
) {
  return createChatModel({
    ...options,
    maxTokens: options?.maxTokens ?? env.llmProductionMaxTokens,
  });
}
