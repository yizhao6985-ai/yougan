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
} as const;

/** 对话、结构化 work 等文本任务。 */
export function createChatModel(options?: OpenAiCompatibleChatModelOptions) {
  assertDashScopeApiKey();

  return createOpenAiCompatibleChatModel(
    {
      apiKey: env.dashscopeApiKey,
      baseURL: env.dashscopeBaseUrl,
      model: env.qwenModel,
      temperature: env.llmTemperature,
      streaming: true,
      maxTokens: env.llmMaxTokens,
      modelKwargs: QWEN_CHAT_KWARGS,
    },
    options,
  );
}
