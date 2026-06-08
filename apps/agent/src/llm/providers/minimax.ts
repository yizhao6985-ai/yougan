/**
 * MiniMax（OpenAI API 兼容）全模态 Chat 模型。
 */
import { env } from "#agent/env.js";
import {
  createOpenAiCompatibleChatModel,
  type OpenAiCompatibleChatModelOptions,
} from "./openai-compatible.js";

function assertMiniMaxApiKey(): void {
  if (!env.minimaxApiKey) {
    throw new Error("MINIMAX_API_KEY_MISSING");
  }
}

/** 图片 / 视频 / 音频 / 文本等多模态任务（参考素材分析等）。 */
export function createMultimodalChatModel(
  options?: OpenAiCompatibleChatModelOptions,
) {
  assertMiniMaxApiKey();

  return createOpenAiCompatibleChatModel(
    {
      apiKey: env.minimaxApiKey,
      baseURL: env.minimaxBaseUrl,
      model: env.minimaxModel,
      temperature: 0.2,
      streaming: false,
      maxTokens: env.minimaxMaxTokens,
    },
    options,
  );
}
