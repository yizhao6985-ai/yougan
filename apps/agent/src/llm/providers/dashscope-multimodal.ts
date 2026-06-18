/**
 * 百炼 Qwen-Omni 多模态 Chat（OpenAI 兼容；参考素材分析等）。
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

/** 图片 / 视频帧 / 文本等多模态结构化分析。 */
export function createMultimodalChatModel(
  options?: OpenAiCompatibleChatModelOptions,
) {
  assertDashScopeApiKey();

  const model = DASHSCOPE_MODELS.multimodal;
  const family = resolveDashScopeChatFamily(model);

  return createOpenAiCompatibleChatModel(
    {
      apiKey: env.dashscopeApiKey,
      baseURL: env.dashscopeBaseUrl,
      model,
      temperature: 0.2,
      streaming: false,
      maxTokens: env.llmMaxTokens,
      modelKwargs: getDashScopeChatKwargs(family, "structured"),
    },
    options,
  );
}
