/**
 * Chat 模型流式调用（LangGraph pushMessage）。
 */
import {
  AIMessage,
  AIMessageChunk,
  type BaseMessage,
} from "@langchain/core/messages";
import type { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { pushMessage } from "@langchain/langgraph";
import { nanoid } from "nanoid";

export type ChatModel = Runnable<
  BaseMessage[],
  AIMessageChunk,
  RunnableConfig
>;

function chunkToAIMessage(
  chunk: AIMessageChunk,
  messageId: string,
): AIMessage {
  return new AIMessage({
    id: messageId,
    content: chunk.content,
    tool_calls: chunk.tool_calls,
    invalid_tool_calls: chunk.invalid_tool_calls,
    usage_metadata: chunk.usage_metadata,
    response_metadata: chunk.response_metadata,
  });
}

/** 流式调用 Chat 模型，逐 chunk pushMessage。用于 llm-chat 子图节点。 */
export async function streamChat(
  model: ChatModel,
  input: BaseMessage[],
  config: RunnableConfig,
): Promise<AIMessage> {
  const stream = await model.stream(input, config);
  let accumulated: AIMessageChunk | undefined;
  let messageId: string | undefined;

  for await (const chunk of stream) {
    accumulated = accumulated ? accumulated.concat(chunk) : chunk;
    const id = accumulated.id ?? messageId ?? (messageId = nanoid());
    messageId = id;
    pushMessage(chunkToAIMessage(accumulated, id), config);
  }

  if (!accumulated) {
    throw new Error("Chat stream returned no chunks");
  }

  const finalId = accumulated.id ?? messageId ?? nanoid();
  return chunkToAIMessage(accumulated, finalId);
}
