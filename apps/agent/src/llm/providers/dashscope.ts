/**
 * 阿里百炼 DashScope（OpenAI 兼容模式）Chat 模型工厂。
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

/** 文本 Chat 模型（对话、结构化输出、多模态 work node 统一使用）。 */
export function createChatModel(options?: OpenAiCompatibleChatModelOptions) {
  assertDashScopeApiKey();

  return createOpenAiCompatibleChatModel(
    {
      apiKey: env.dashscopeApiKey,
      baseURL: env.dashscopeBaseUrl,
      model: env.llmModel,
      temperature: env.llmTemperature,
      streaming: true,
      maxTokens: env.llmMaxTokens,
      modelKwargs: {
        enable_thinking: false,
        incremental_output: true,
      },
    },
    options,
  );
}
