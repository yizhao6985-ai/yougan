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

type ChatModelWithKwargs = BaseChatModel & {
  modelKwargs?: Record<string, unknown>;
};

/** 百炼 thinking mode 与 functionCalling 结构化输出不兼容。 */
function forStructuredInvoke(llm: BaseChatModel): BaseChatModel {
  const chat = llm as ChatModelWithKwargs;
  chat.modelKwargs = {
    ...chat.modelKwargs,
    enable_thinking: false,
  };
  return llm;
}

/** 同步结构化输出，返回 Zod 校验后的对象。 */
export async function invokeStructured<T extends Record<string, unknown>>(
  llm: BaseChatModel,
  schema: z.ZodType<T>,
  input: BaseLanguageModelInput,
  options?: StructuredInvokeOptions,
): Promise<T> {
  const structured = forStructuredInvoke(llm).withStructuredOutput(schema, {
    name: options?.name ?? "structured_output",
    method: options?.method ?? "functionCalling",
  });
  return structured.invoke(input) as Promise<T>;
}
