/**
 * OpenAI 兼容端点上的 Chat 模型工厂（百炼 DashScope 等）。
 */
import { ChatOpenAI } from "@langchain/openai";

export type OpenAiCompatibleProviderConfig = {
  apiKey: string;
  baseURL: string;
  model: string;
  temperature: number;
  streaming: boolean;
  maxTokens?: number;
  /** 透传到请求体的额外厂商字段（按需） */
  modelKwargs?: Record<string, unknown>;
};

export type OpenAiCompatibleChatModelOptions = {
  temperature?: number;
  streaming?: boolean;
  /** 与 provider config 合并后透传到请求体（百炼 enable_thinking 等） */
  modelKwargs?: Record<string, unknown>;
};

export function createOpenAiCompatibleChatModel(
  config: OpenAiCompatibleProviderConfig,
  options?: OpenAiCompatibleChatModelOptions,
) {
  const modelKwargs = {
    ...config.modelKwargs,
    ...options?.modelKwargs,
  };

  return new ChatOpenAI({
    model: config.model,
    apiKey: config.apiKey,
    temperature: options?.temperature ?? config.temperature,
    streaming: options?.streaming ?? config.streaming,
    maxTokens: config.maxTokens,
    configuration: {
      baseURL: config.baseURL,
    },
    ...(Object.keys(modelKwargs).length > 0 ? { modelKwargs } : {}),
  });
}
