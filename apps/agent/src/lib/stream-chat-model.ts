/**
 * 流式调用 Chat 模型：逐 chunk 通过 pushMessage 写入 graph state。
 * 运行侧以 streamMode=values 推送全量 state；节点内增量经 updates 事件由前端合并进 values。
 */
import {
  AIMessage,
  AIMessageChunk,
  type BaseMessage,
} from "@langchain/core/messages";
import type { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { pushMessage } from "@langchain/langgraph";
import { nanoid } from "nanoid";

import { env } from "#agent/env.js";

type StreamableChatModel = Runnable<
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

/** 消费模型流并返回最终 AIMessage；流式开启时同步 pushMessage 更新 graph state。 */
export async function streamChatModelToAIMessage(
  model: StreamableChatModel,
  input: BaseMessage[],
  config: RunnableConfig,
): Promise<AIMessage> {
  if (!env.llmStreaming) {
    const response = await model.invoke(input, config);
    return response instanceof AIMessage
      ? response
      : chunkToAIMessage(response, response.id ?? nanoid());
  }

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
    throw new Error("LLM stream returned no chunks");
  }

  const finalId = accumulated.id ?? messageId ?? nanoid();
  return chunkToAIMessage(accumulated, finalId);
}
