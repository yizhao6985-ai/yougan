/**
 * 结构化输出调用（同步 invoke）。
 */
import type { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { z } from "zod";

type StructuredOutputMethod = "functionCalling" | "jsonMode";

export type StructuredInvokeOptions = {
  name?: string;
  method?: StructuredOutputMethod;
};

/** 同步结构化输出，返回 Zod 校验后的对象。 */
export async function invokeStructured<T extends Record<string, unknown>>(
  llm: BaseChatModel,
  schema: z.ZodType<T>,
  input: BaseLanguageModelInput,
  options?: StructuredInvokeOptions,
): Promise<T> {
  const structured = llm.withStructuredOutput(schema, {
    name: options?.name ?? "structured_output",
    method: options?.method ?? "functionCalling",
  });
  return structured.invoke(input) as Promise<T>;
}
