/**
 * Agent 环境变量解析与归一化。
 * MiniMax / DeepSeek 均通过 Anthropic 兼容端点接入 LangChain ChatAnthropic。
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import {
  envBoolean,
  optionalString,
  parseEnv,
  requiredString,
} from "./lib/env/index.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv({ path: resolve(root, ".env") });

const AgentEnvSchema = z
  .object({
    POSTGRES_URI: requiredString,
    MINIMAX_API_KEY: optionalString,
    MINIMAX_CHAT_BASE_URL: optionalString,
    MINIMAX_CHAT_MODEL: optionalString,
    MINIMAX_MAX_TOKENS: z.coerce.number().int().positive().default(8192),
    MINIMAX_THINKING_TYPE: optionalString,
    MINIMAX_THINKING_BUDGET_TOKENS: z.coerce
      .number()
      .int()
      .positive()
      .default(2000),
    LLM_STREAMING: envBoolean(true),
    MINIMAX_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
    DEEPSEEK_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.3),
    DEEPSEEK_API_KEY: optionalString,
    DEEPSEEK_BASE_URL: optionalString,
    DEEPSEEK_MODEL: optionalString,
  })
  .transform((env) => ({
    postgresUri: env.POSTGRES_URI,
    minimaxApiKey: env.MINIMAX_API_KEY ?? "",
    minimaxChatBaseUrl:
      env.MINIMAX_CHAT_BASE_URL ?? "https://api.minimaxi.com/anthropic",
    minimaxChatModel: env.MINIMAX_CHAT_MODEL ?? "MiniMax-M2.7",
    minimaxMaxTokens: env.MINIMAX_MAX_TOKENS,
    minimaxThinkingType: env.MINIMAX_THINKING_TYPE,
    minimaxThinkingBudgetTokens: env.MINIMAX_THINKING_BUDGET_TOKENS,
    llmStreaming: env.LLM_STREAMING,
    minimaxTemperature: env.MINIMAX_TEMPERATURE,
    deepseekTemperature: env.DEEPSEEK_TEMPERATURE,
    deepseekApiKey: env.DEEPSEEK_API_KEY ?? "",
    deepseekBaseUrl:
      env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/anthropic",
    deepseekModel: env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
  }));

export type AgentEnv = z.infer<typeof AgentEnvSchema>;

export const env = parseEnv(AgentEnvSchema, "agent");
