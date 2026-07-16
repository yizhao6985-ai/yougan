/**
 * 结构化输出调用（同步 invoke）。
 * 内部 LLM 默认带 nostream tag，避免 messages-tuple 泄漏到前端；
 * 并强制 streaming: false，走一次性 completion 而非流式读 chunk。
 * 超时与重试由节点 `addNode({ timeout, retryPolicy })` 配置。
 */
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import type { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { z } from "zod";
import type { MeteringModelId } from "@yougan/domain";

import { sanitizeMessagesForTextChat } from "#agent/messages/llm-input.js";
import { OPENAI_MODELS } from "#agent/llm/providers/index.js";
import {
  getRunMeteringAccumulator,
  recordRunMeteringUsageIfMissing,
  resolveMeteringModelId,
  withMeteringCallbacks,
} from "./metering.js";

type StructuredOutputMethod = "functionCalling" | "jsonMode" | "jsonSchema";

export type StructuredInvokeOptions = {
  name?: string;
  method?: StructuredOutputMethod;
  meteringModelId?: MeteringModelId;
};

type ChatModelWithStreaming = BaseChatModel & {
  /** ChatOpenAI：结构化 invoke 走非流式，避免 _streamResponseChunks 与 AbortSignal 交织 */
  streaming?: boolean;
};

type ChatModelWithName = BaseChatModel & {
  model?: string;
  modelName?: string;
};

/** LangGraph StreamMessagesHandler 同时识别这两个 tag。 */
const NOSTREAM_TAGS = ["nostream"] as const;

/** 合并父级 config，并标记为不向 messages 通道推流。 */
export function isolatedStructuredConfig(
  config?: RunnableConfig,
): RunnableConfig {
  const tags = [...new Set([...(config?.tags ?? []), ...NOSTREAM_TAGS])];
  return { ...config, tags };
}

/** 结构化 invoke 关闭 streaming。 */
function forStructuredInvoke(llm: BaseChatModel): BaseChatModel {
  const chat = llm as ChatModelWithStreaming;
  if ("streaming" in chat) {
    chat.streaming = false;
  }
  return llm;
}

function isStructuredCompatError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /tool_choice|Thinking mode|enable_thinking|response_format|json_schema/i.test(
    message,
  );
}

function sanitizeStructuredInput(
  input: BaseLanguageModelInput,
): BaseLanguageModelInput {
  if (!Array.isArray(input)) return input;
  return sanitizeMessagesForTextChat(input as BaseMessage[]);
}

function resolveStructuredMeteringModelId(
  llm: BaseChatModel,
  options?: StructuredInvokeOptions,
): MeteringModelId {
  if (options?.meteringModelId) return options.meteringModelId;
  const named = llm as ChatModelWithName;
  const modelName =
    typeof named.model === "string"
      ? named.model
      : typeof named.modelName === "string"
        ? named.modelName
        : OPENAI_MODELS.chat;
  return resolveMeteringModelId(modelName);
}

/** 同步结构化输出，返回 Zod 校验后的对象。 */
export async function invokeStructured<T extends Record<string, unknown>>(
  llm: BaseChatModel,
  schema: z.ZodType<T>,
  input: BaseLanguageModelInput,
  options?: StructuredInvokeOptions,
  config?: RunnableConfig,
): Promise<T> {
  const meteringModelId = resolveStructuredMeteringModelId(llm, options);
  const baseConfig = isolatedStructuredConfig(config);
  const sanitizedInput = sanitizeStructuredInput(input);
  const preparedLlm = forStructuredInvoke(llm);
  const methodAttempts: (StructuredOutputMethod | undefined)[] =
    options?.method !== undefined ? [options.method] : [undefined, "jsonMode"];

  let lastError: unknown;
  for (const method of methodAttempts) {
    const structuredOutputOptions: {
      name: string;
      includeRaw: true;
      method?: StructuredOutputMethod;
    } = {
      name: options?.name ?? "structured_output",
      includeRaw: true,
    };
    if (method !== undefined) {
      structuredOutputOptions.method = method;
    }

    const structured = preparedLlm.withStructuredOutput(
      schema,
      structuredOutputOptions,
    );

    try {
      const callCountBefore = getRunMeteringAccumulator(config).callCount;
      const meteredConfig = withMeteringCallbacks(
        baseConfig,
        meteringModelId,
        config,
      );
      const result = (await structured.invoke(
        sanitizedInput,
        meteredConfig,
      )) as { parsed: T | null | undefined; raw: BaseMessage };
      if (getRunMeteringAccumulator(config).callCount === callCountBefore) {
        const raw = result.raw;
        if (raw instanceof AIMessage) {
          recordRunMeteringUsageIfMissing(
            config,
            meteringModelId,
            raw.usage_metadata,
          );
        }
      }
      if (result.parsed == null) {
        throw new Error("STRUCTURED_OUTPUT_PARSE_FAILED");
      }
      return result.parsed;
    } catch (error) {
      lastError = error;
      const hasFallback =
        methodAttempts.indexOf(method) + 1 < methodAttempts.length;
      if (!hasFallback || !isStructuredCompatError(error)) {
        throw error;
      }
    }
  }
  throw lastError;
}
