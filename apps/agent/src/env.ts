/**
 * Agent 环境变量解析与归一化。
 * 百炼凭证：仅 DASHSCOPE_API_KEY + DASHSCOPE_BASE_URL；模型见 llm/providers/catalog.ts。
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

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
    LLM_MAX_TOKENS: z.coerce.number().int().positive().default(8192),
    /** 制作产出 / 整合成稿：输出上限高于通用结构化调用 */
    LLM_PRODUCTION_MAX_TOKENS: z.coerce
      .number()
      .int()
      .positive()
      .default(32768),
    LLM_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
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
      llmMaxTokens: env.LLM_MAX_TOKENS,
      llmProductionMaxTokens: env.LLM_PRODUCTION_MAX_TOKENS,
      llmTemperature: env.LLM_TEMPERATURE,
      tavilyApiKey: env.TAVILY_API_KEY ?? "",
    };
  });

export type AgentEnv = z.infer<typeof AgentEnvSchema>;

export const env = parseEnv(AgentEnvSchema, "agent");
