/**
 * Agent 环境变量解析与归一化。
 * Chat：Qwen（百炼 OpenAI 兼容）+ MiniMax（多模态 OpenAI 兼容）。
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import {
  DASHSCOPE_ASR_MODELS,
  DASHSCOPE_IMAGE_MODELS,
  MINIMAX_MODELS,
  QWEN_MODELS,
} from "./llm/providers/catalog.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv({ path: resolve(root, ".env") });

/** 空字符串视为未设置，便于 optional 环境变量校验 */
function emptyToUndefined(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const requiredString = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.string().min(1),
);

function parseEnv<S extends z.ZodTypeAny>(
  schema: S,
  label: string,
): z.infer<S> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    console.error(
      `Invalid ${label} environment variables:`,
      result.error.flatten().fieldErrors,
    );
    throw new Error(`Invalid ${label} environment variables`);
  }
  return result.data;
}

function resolveDashScopeApiBaseUrl(compatibleBaseUrl: string): string {
  return `${new URL(compatibleBaseUrl).origin}/api/v1`;
}

const AgentEnvSchema = z
  .object({
    POSTGRES_URI: requiredString,
    DASHSCOPE_API_KEY: optionalString,
    DASHSCOPE_BASE_URL: optionalString,
    DASHSCOPE_MODEL: optionalString,
    LLM_MAX_TOKENS: z.coerce.number().int().positive().default(8192),
    LLM_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
    LLM_MODEL_IMAGE: optionalString,
    LLM_MODEL_ASR: optionalString,
    MINIMAX_API_KEY: optionalString,
    MINIMAX_BASE_URL: optionalString,
    MINIMAX_MODEL: optionalString,
    MINIMAX_MAX_TOKENS: z.coerce.number().int().positive().optional(),
    TAVILY_API_KEY: optionalString,
  })
  .transform((env) => {
    const dashscopeBaseUrl =
      env.DASHSCOPE_BASE_URL ??
      "https://dashscope.aliyuncs.com/compatible-mode/v1";

    return {
      postgresUri: env.POSTGRES_URI,
      dashscopeApiKey: env.DASHSCOPE_API_KEY ?? "",
      dashscopeBaseUrl,
      dashscopeApiBaseUrl: resolveDashScopeApiBaseUrl(dashscopeBaseUrl),
      dashscopeModel: env.DASHSCOPE_MODEL ?? QWEN_MODELS.default,
      llmMaxTokens: env.LLM_MAX_TOKENS,
      llmTemperature: env.LLM_TEMPERATURE,
      llmModelImage:
        env.LLM_MODEL_IMAGE ?? DASHSCOPE_IMAGE_MODELS.qwenImage20Pro,
      llmModelAsr: env.LLM_MODEL_ASR ?? DASHSCOPE_ASR_MODELS.funAsr,
      minimaxApiKey: env.MINIMAX_API_KEY ?? "",
      minimaxBaseUrl: env.MINIMAX_BASE_URL ?? "https://api.minimaxi.com/v1",
      minimaxModel: env.MINIMAX_MODEL ?? MINIMAX_MODELS.m3,
      minimaxMaxTokens: env.MINIMAX_MAX_TOKENS ?? env.LLM_MAX_TOKENS,
      tavilyApiKey: env.TAVILY_API_KEY ?? "",
    };
  });

export type AgentEnv = z.infer<typeof AgentEnvSchema>;

export const env = parseEnv(AgentEnvSchema, "agent");
