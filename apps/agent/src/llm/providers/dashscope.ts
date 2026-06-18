/**
 * 百炼 DashScope 文本 Chat（OpenAI 兼容）。
 */
import { env } from "#agent/env.js";
import { DASHSCOPE_MODELS } from "./catalog.js";
import {
  getDashScopeChatKwargs,
  resolveDashScopeChatFamily,
} from "./dashscope-chat-config.js";
import {
  createOpenAiCompatibleChatModel,
  type OpenAiCompatibleChatModelOptions,
} from "./openai-compatible.js";

function assertDashScopeApiKey(): void {
  if (!env.dashscopeApiKey) {
    throw new Error("DASHSCOPE_API_KEY_MISSING");
  }
}

/** 对话、结构化 work 等文本任务（计划/验收/建议等，默认较短输出）。 */
export function createChatModel(options?: OpenAiCompatibleChatModelOptions) {
  assertDashScopeApiKey();

  const model = DASHSCOPE_MODELS.chat;
  const family = resolveDashScopeChatFamily(model);

  return createOpenAiCompatibleChatModel(
    {
      apiKey: env.dashscopeApiKey,
      baseURL: env.dashscopeBaseUrl,
      model,
      temperature: env.llmTemperature,
      streaming: true,
      maxTokens: env.llmMaxTokens,
      modelKwargs: getDashScopeChatKwargs(family, "stream"),
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
