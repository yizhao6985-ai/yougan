/**
 * OpenAI 兼容端点文本 Chat 工厂。
 */
import { ChatOpenAI } from "@langchain/openai";

import { env } from "#agent/env.js";

export const OPENAI_MODELS = env.openaiModels;

export type ChatModelOptions = {
  temperature?: number;
  streaming?: boolean;
  maxTokens?: number;
  modelKwargs?: Record<string, unknown>;
};

function assertOpenAiApiKey(): void {
  if (!env.openaiApiKey) {
    throw new Error("OPENAI_API_KEY_MISSING");
  }
}

/** 对话、结构化 work 等文本任务（计划/验收/建议等，默认较短输出）。 */
export function createChatModel(options?: ChatModelOptions) {
  assertOpenAiApiKey();

  const modelKwargs = options?.modelKwargs ?? {};

  return new ChatOpenAI({
    model: OPENAI_MODELS.chat,
    apiKey: env.openaiApiKey,
    temperature: options?.temperature ?? env.llmTemperature,
    streaming: options?.streaming ?? true,
    maxTokens: options?.maxTokens ?? env.llmMaxTokens,
    configuration: {
      baseURL: env.openaiBaseUrl,
    },
    ...(Object.keys(modelKwargs).length > 0 ? { modelKwargs } : {}),
  });
}

/** 制作子图：单任务产出与 assemble 整合，允许更长 completion。 */
export function createProductionChatModel(options?: ChatModelOptions) {
  return createChatModel({
    ...options,
    maxTokens: options?.maxTokens ?? env.llmProductionMaxTokens,
  });
}
