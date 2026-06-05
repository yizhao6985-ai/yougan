/**
 * LangChain withStructuredOutput 封装。
 * - functionCalling：ChatOpenAI 等（默认）
 * - jsonMode：response_format json_object
 */
import type { AIMessageChunk } from "@langchain/core/messages";
import type { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { z } from "zod";

type StructuredOutputMethod = "functionCalling" | "jsonMode";

export type StructuredOutputOptions = {
  name?: string;
  method?: StructuredOutputMethod;
};

export type StructuredOutputRawChunk<T extends Record<string, unknown>> = {
  raw: AIMessageChunk;
  parsed: T | null;
};

function createStructuredOutputRunnable<T extends Record<string, unknown>>(
  llm: BaseChatModel,
  schema: z.ZodType<T>,
  options?: StructuredOutputOptions,
) {
  return llm.withStructuredOutput(schema, {
    name: options?.name ?? "structured_output",
    method: options?.method ?? "functionCalling",
  });
}

function createStructuredOutputRunnableWithRaw<
  T extends Record<string, unknown>,
>(llm: BaseChatModel, schema: z.ZodType<T>, options?: StructuredOutputOptions) {
  return llm.withStructuredOutput(schema, {
    name: options?.name ?? "structured_output",
    method: options?.method ?? "functionCalling",
    includeRaw: true,
  });
}

/** 使用 LangChain withStructuredOutput 调用模型并返回经 Zod 校验的结果。 */
export async function invokeStructuredOutput<T extends Record<string, unknown>>(
  llm: BaseChatModel,
  schema: z.ZodType<T>,
  input: BaseLanguageModelInput,
  options?: StructuredOutputOptions,
): Promise<T> {
  const structured = createStructuredOutputRunnable(llm, schema, options);
  return structured.invoke(input) as Promise<T>;
}

/** 流式结构化输出：返回 LangChain Runnable 的 stream（增量 chunk，末块为完整解析结果）。 */
export async function streamStructuredOutput<T extends Record<string, unknown>>(
  llm: BaseChatModel,
  schema: z.ZodType<T>,
  input: BaseLanguageModelInput,
  options?: StructuredOutputOptions,
) {
  const structured = createStructuredOutputRunnable(llm, schema, options);
  return structured.stream(input) as Promise<AsyncIterable<T>>;
}

/**
 * 流式结构化输出（含原始消息 chunk）：便于向前端透传 token / tool-call 参数增量。
 * 每个 chunk 为 `{ raw, parsed }`，`parsed` 在尚未完成解析时为 `null`。
 */
export async function streamStructuredOutputWithRaw<
  T extends Record<string, unknown>,
>(
  llm: BaseChatModel,
  schema: z.ZodType<T>,
  input: BaseLanguageModelInput,
  options?: StructuredOutputOptions,
) {
  const structured = createStructuredOutputRunnableWithRaw(
    llm,
    schema,
    options,
  );
  return structured.stream(input) as Promise<
    AsyncIterable<StructuredOutputRawChunk<T>>
  >;
}

/** 消费结构化输出流并返回最终解析结果（与 invoke 等价，但走 stream 通道）。 */
export async function consumeStructuredOutputStream<
  T extends Record<string, unknown>,
>(stream: AsyncIterable<T | StructuredOutputRawChunk<T>>): Promise<T> {
  let latest: T | undefined;

  for await (const chunk of stream) {
    if (chunk && typeof chunk === "object" && "parsed" in chunk) {
      const parsed = (chunk as StructuredOutputRawChunk<T>).parsed;
      if (parsed != null) {
        latest = parsed;
      }
      continue;
    }
    latest = chunk as T;
  }

  if (latest === undefined) {
    throw new Error("Structured output stream returned no chunks");
  }

  return latest;
}
