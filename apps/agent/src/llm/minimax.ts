/**
 * MiniMax 主对话模型（Anthropic 兼容端点）。
 * 用于：灵感工具轮、大纲 agent、创作 agent。
 */
import { ChatAnthropic } from "@langchain/anthropic";

import { env } from "../env.js";

type ThinkingConfig =
  | { type: "enabled"; budget_tokens: number }
  | { type: "disabled" };

function resolveThinkingConfig(): ThinkingConfig | undefined {
  const type = env.minimaxThinkingType?.toLowerCase();
  if (!type || type === "disabled") {
    return undefined;
  }

  // Anthropic SDK 仅定义 enabled / disabled；MiniMax 的 adaptive 按 enabled + budget 下发
  if (type === "enabled" || type === "adaptive") {
    return {
      type: "enabled",
      budget_tokens: env.minimaxThinkingBudgetTokens,
    };
  }

  return undefined;
}

/**
 * MiniMax 对话模型（通过 Anthropic 兼容端点接入 LangChain）。
 */
export function createChatModel(options?: {
  temperature?: number;
  streaming?: boolean;
}) {
  if (!env.minimaxApiKey) {
    throw new Error("MINIMAX_API_KEY_MISSING");
  }

  const temperature = options?.temperature ?? env.minimaxTemperature;
  const streaming = options?.streaming ?? env.llmStreaming;
  const thinking = resolveThinkingConfig();

  return new ChatAnthropic({
    model: env.minimaxChatModel,
    apiKey: env.minimaxApiKey,
    ...(thinking ? {} : { temperature }),
    streaming,
    maxTokens: env.minimaxMaxTokens,
    anthropicApiUrl: env.minimaxChatBaseUrl,
    ...(thinking ? { thinking } : {}),
  });
}
