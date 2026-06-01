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
  /** 透传到请求体的额外字段，如 MiniMax reasoning_split */
  modelKwargs?: Record<string, unknown>;
};

export type OpenAiCompatibleChatModelOptions = {
  temperature?: number;
  streaming?: boolean;
};

export function createOpenAiCompatibleChatModel(
  config: OpenAiCompatibleProviderConfig,
  options?: OpenAiCompatibleChatModelOptions,
) {
  return new ChatOpenAI({
    model: config.model,
    apiKey: config.apiKey,
    temperature: options?.temperature ?? config.temperature,
    streaming: options?.streaming ?? config.streaming,
    maxTokens: config.maxTokens,
    configuration: {
      baseURL: config.baseURL,
    },
    modelKwargs: config.modelKwargs,
  });
}
