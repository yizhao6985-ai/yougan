/**
 * 结构化输出调用（同步 invoke）。
 * 内部 LLM 默认带 nostream tag，避免 messages-tuple 泄漏到前端；
 * 并强制 streaming: false，走一次性 completion 而非流式读 chunk。
 */
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import type { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { z } from "zod";
import type { MeteringModelId } from "@yougan/domain";

import { sanitizeMessagesForTextChat } from "#agent/messages/llm-input.js";
import { env } from "#agent/env.js";
import {
  getRunMeteringAccumulator,
  recordRunMeteringUsageIfMissing,
  resolveMinimaxMeteringModelId,
  resolveQwenMeteringModelId,
  withMeteringCallbacks,
} from "./metering.js";

type StructuredOutputMethod = "functionCalling" | "jsonMode";

export type StructuredInvokeOptions = {
  name?: string;
  method?: StructuredOutputMethod;
  meteringModelId?: MeteringModelId;
  /** 保留 human 消息中的 image_url / 多模态 part（默认会压平成纯文本） */
  preserveMultimodal?: boolean;
};

type ChatModelWithKwargs = BaseChatModel & {
  modelKwargs?: Record<string, unknown>;
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

/** Qwen：关闭 thinking；全模型：关闭 streaming（结构化产出专用非流式 invoke） */
function forStructuredInvoke(llm: BaseChatModel): BaseChatModel {
  const chat = llm as ChatModelWithKwargs;
  if ("streaming" in chat) {
    chat.streaming = false;
  }
  if (chat.modelKwargs !== undefined) {
    chat.modelKwargs = {
      ...chat.modelKwargs,
      enable_thinking: false,
    };
  }
  return llm;
}

function sanitizeStructuredInput(
  input: BaseLanguageModelInput,
  preserveMultimodal?: boolean,
): BaseLanguageModelInput {
  if (preserveMultimodal || !Array.isArray(input)) return input;
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
        : env.dashscopeModel;
  const normalized = modelName.toLowerCase();
  if (normalized.includes("minimax")) {
    return resolveMinimaxMeteringModelId(modelName);
  }
  return resolveQwenMeteringModelId(modelName);
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
  const callCountBefore = getRunMeteringAccumulator(config).callCount;
  const meteredConfig = withMeteringCallbacks(
    baseConfig,
    meteringModelId,
    config,
  );
  const structured = forStructuredInvoke(llm).withStructuredOutput(schema, {
    name: options?.name ?? "structured_output",
    method: options?.method ?? "functionCalling",
    includeRaw: true,
  });
  const result = (await structured.invoke(
    sanitizeStructuredInput(input, options?.preserveMultimodal),
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
}

/** 多模态结构化输出（图片/视频帧等 content part 不会被压平成纯文本）。 */
export async function invokeMultimodalStructured<
  T extends Record<string, unknown>,
>(
  llm: BaseChatModel,
  schema: z.ZodType<T>,
  input: BaseLanguageModelInput,
  options?: Omit<StructuredInvokeOptions, "preserveMultimodal">,
  config?: RunnableConfig,
): Promise<T> {
  return invokeStructured(
    llm,
    schema,
    input,
    { ...options, preserveMultimodal: true },
    config,
  );
}
