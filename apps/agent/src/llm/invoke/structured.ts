/**
 * 结构化输出调用（同步 invoke）。
 * 内部 LLM 默认带 nostream tag，避免 messages-tuple 泄漏到前端。
 */
import type { BaseMessage } from "@langchain/core/messages";
import type { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { z } from "zod";
import type { MeteringModelId } from "@yougan/domain";

import { sanitizeMessagesForTextChat } from "#agent/messages/llm-input.js";
import { env } from "#agent/env.js";
import {
  resolveMinimaxMeteringModelId,
  resolveQwenMeteringModelId,
  withMeteringCallbacks,
} from "./metering.js";

type StructuredOutputMethod = "functionCalling" | "jsonMode";

export type StructuredInvokeOptions = {
  name?: string;
  method?: StructuredOutputMethod;
  meteringModelId?: MeteringModelId;
};

type ChatModelWithKwargs = BaseChatModel & {
  modelKwargs?: Record<string, unknown>;
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

/** Qwen：关闭 thinking，避免与 functionCalling 结构化输出冲突。 */
function forStructuredInvoke(llm: BaseChatModel): BaseChatModel {
  const chat = llm as ChatModelWithKwargs;
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
): BaseLanguageModelInput {
  if (!Array.isArray(input)) return input;
  return sanitizeMessagesForTextChat(input as BaseMessage[]);
}

function resolveStructuredMeteringModelId(
  llm: BaseChatModel,
  options?: StructuredInvokeOptions,
): MeteringModelId {
  if (options?.meteringModelId) return options.meteringModelId;
  const modelName =
    typeof llm.model === "string"
      ? llm.model
      : typeof llm.modelName === "string"
        ? llm.modelName
        : env.qwenModel;
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
  const meteredConfig = withMeteringCallbacks(baseConfig, meteringModelId);
  const structured = forStructuredInvoke(llm).withStructuredOutput(schema, {
    name: options?.name ?? "structured_output",
    method: options?.method ?? "functionCalling",
  });
  const result = (await structured.invoke(
    sanitizeStructuredInput(input),
    meteredConfig,
  )) as T;
  return result;
}
