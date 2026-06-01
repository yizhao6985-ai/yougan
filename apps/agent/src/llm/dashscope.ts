/**
 * 阿里百炼 DashScope（OpenAI 兼容模式）模型工厂。
 */
import { env } from "../env.js";
import type { TextLlmRole } from "./models.js";
import {
  createOpenAiCompatibleChatModel,
  type OpenAiCompatibleChatModelOptions,
} from "./openai-compatible.js";

function resolveModel(role: TextLlmRole): string {
  return role === "structured" ? env.llmModelStructured : env.llmModelChat;
}

function defaultTemperature(role: TextLlmRole): number {
  return role === "structured"
    ? env.llmStructuredTemperature
    : env.llmTemperature;
}

function assertDashScopeApiKey(): void {
  if (!env.dashscopeApiKey) {
    throw new Error("DASHSCOPE_API_KEY_MISSING");
  }
}

export function createDashScopeTextModel(
  role: TextLlmRole,
  options?: OpenAiCompatibleChatModelOptions,
) {
  assertDashScopeApiKey();

  return createOpenAiCompatibleChatModel(
    {
      apiKey: env.dashscopeApiKey,
      baseURL: env.dashscopeBaseUrl,
      model: resolveModel(role),
      temperature: defaultTemperature(role),
      streaming: env.llmStreaming,
      maxTokens: env.llmMaxTokens,
    },
    options,
  );
}

/** 主对话模型：ReAct 编排、参考素材理解；创作团队出稿可传入用户创意度覆盖 temperature。 */
export function createChatModel(options?: OpenAiCompatibleChatModelOptions) {
  return createDashScopeTextModel("chat", options);
}

/** 结构化输出（创意总监 / 灵感建议 / 侧栏推荐） */
export function createStructuredModel(
  options?: OpenAiCompatibleChatModelOptions,
) {
  return createDashScopeTextModel("structured", options);
}
