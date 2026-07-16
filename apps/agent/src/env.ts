/**
 * Agent 环境变量解析与归一化。
 * OpenAI 兼容端点凭证与模型 ID 均可通过环境变量配置。
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
  (value) => (typeof value !== "string" ? value : value.trim()),
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

/** 未设置环境变量时的默认模型 ID */
const DEFAULT_OPENAI_CHAT_MODEL = "deepseek-v4-pro";

const AgentEnvSchema = z
  .object({
    POSTGRES_URI: requiredString,
    OPENAI_API_KEY: optionalString,
    OPENAI_BASE_URL: optionalString,
    /** 主对话、结构化 work、tool calling */
    OPENAI_CHAT_MODEL: optionalString,
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
    const openaiBaseUrl =
      env.OPENAI_BASE_URL ??
      "https://dashscope.aliyuncs.com/compatible-mode/v1";

    return {
      postgresUri: env.POSTGRES_URI,
      openaiApiKey: env.OPENAI_API_KEY ?? "",
      openaiBaseUrl,
      openaiModels: {
        chat: env.OPENAI_CHAT_MODEL ?? DEFAULT_OPENAI_CHAT_MODEL,
      },
      llmMaxTokens: env.LLM_MAX_TOKENS,
      llmProductionMaxTokens: env.LLM_PRODUCTION_MAX_TOKENS,
      llmTemperature: env.LLM_TEMPERATURE,
      tavilyApiKey: env.TAVILY_API_KEY ?? "",
    };
  });

export type AgentEnv = z.infer<typeof AgentEnvSchema>;

export const env = parseEnv(AgentEnvSchema, "agent");
