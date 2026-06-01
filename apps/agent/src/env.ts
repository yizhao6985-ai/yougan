/**
 * Agent 环境变量解析与归一化。
 * 全部 LLM 经阿里百炼 DashScope OpenAI 兼容端点接入。
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import {
  DASHSCOPE_IMAGE_MODELS,
  DASHSCOPE_TEXT_MODELS,
} from "./llm/models.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv({ path: resolve(root, ".env") });

/** 空字符串视为未设置，便于 optional 环境变量校验 */
function emptyToUndefined(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const optionalString = z.preprocess(
  emptyToUndefined,
  z.string().optional(),
);

const requiredString = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.string().min(1),
);

/** 解析布尔环境变量；未设置时返回 defaultValue */
function envBoolean(defaultValue: boolean) {
  return z.preprocess((value) => {
    if (value === undefined || value === "") return defaultValue;
    if (typeof value !== "string") return value;
    const lower = value.trim().toLowerCase();
    if (lower === "false" || lower === "0" || lower === "no") return false;
    if (lower === "true" || lower === "1" || lower === "yes") return true;
    return defaultValue;
  }, z.boolean());
}

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
    LLM_MAX_TOKENS: z.coerce.number().int().positive().default(8192),
    LLM_STREAMING: envBoolean(true),
    LLM_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
    LLM_STRUCTURED_TEMPERATURE: z.coerce
      .number()
      .min(0)
      .max(2)
      .default(0.3),
    LLM_MODEL_CHAT: optionalString,
    LLM_MODEL_STRUCTURED: optionalString,
    LLM_MODEL_IMAGE: optionalString,
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
      llmMaxTokens: env.LLM_MAX_TOKENS,
      llmStreaming: env.LLM_STREAMING,
      llmTemperature: env.LLM_TEMPERATURE,
      llmStructuredTemperature: env.LLM_STRUCTURED_TEMPERATURE,
      llmModelChat: env.LLM_MODEL_CHAT ?? DASHSCOPE_TEXT_MODELS.qwen37Max,
      llmModelStructured:
        env.LLM_MODEL_STRUCTURED ?? DASHSCOPE_TEXT_MODELS.deepseekV4Pro,
      llmModelImage:
        env.LLM_MODEL_IMAGE ?? DASHSCOPE_IMAGE_MODELS.qwenImage20Pro,
    };
  });

export type AgentEnv = z.infer<typeof AgentEnvSchema>;

export const env = parseEnv(AgentEnvSchema, "agent");
