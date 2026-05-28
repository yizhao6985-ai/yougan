/**
 * DeepSeek 模型接入（Anthropic 兼容端点）。
 * 用于结构化输出、总结、同步等需 tool calling 的场景。
 */
import { ChatAnthropic } from "@langchain/anthropic";

import { env } from "../env.js";

/** Anthropic 兼容端点 */
export function createDeepSeekModel(options?: {
  temperature?: number;
  streaming?: boolean;
}) {
  if (!env.deepseekApiKey) {
    throw new Error("DEEPSEEK_API_KEY_MISSING");
  }

  return new ChatAnthropic({
    model: env.deepseekModel,
    apiKey: env.deepseekApiKey,
    anthropicApiUrl: env.deepseekBaseUrl,
    temperature: options?.temperature ?? env.deepseekTemperature,
    streaming: options?.streaming ?? env.llmStreaming,
  });
}
