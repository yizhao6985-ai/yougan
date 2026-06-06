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

/** 关闭 LLM callback 自动 messages 流，改由 pushMessage 推增量 chunk。 */
const NOSTREAM_TAGS = ["nostream"] as const;

export type ChatModel = Runnable<BaseMessage[], AIMessageChunk, RunnableConfig>;

type StreamTextChannel = {
  emitted: string;
  cumulativeMode: boolean;
};

function createStreamTextChannel(): StreamTextChannel {
  return { emitted: "", cumulativeMode: false };
}

/**
 * 百炼部分路径会以「迄今全文」发 delta；LangChain concat 对字符串做 +=，需先归一成增量后缀。
 */
function normalizeStreamingTextDelta(
  channel: StreamTextChannel,
  delta: string,
): string {
  if (!delta) return "";

  const { emitted } = channel;
  if (emitted.length > 0 && delta.startsWith(emitted)) {
    channel.cumulativeMode = true;
    channel.emitted = delta;
    return delta.slice(emitted.length);
  }

  if (channel.cumulativeMode && delta === emitted) {
    return "";
  }

  channel.emitted = emitted + delta;
  return delta;
}

function normalizeChunkForConcat(
  chunk: AIMessageChunk,
  content: StreamTextChannel,
): AIMessageChunk {
  let normalizedContent = chunk.content;
  if (typeof normalizedContent === "string" && normalizedContent) {
    normalizedContent = normalizeStreamingTextDelta(content, normalizedContent);
  }

  return new AIMessageChunk({
    id: chunk.id,
    content: normalizedContent,
    tool_call_chunks: chunk.tool_call_chunks,
    tool_calls: chunk.tool_calls,
    invalid_tool_calls: chunk.invalid_tool_calls,
    additional_kwargs: chunk.additional_kwargs,
    response_metadata: chunk.response_metadata,
    usage_metadata: chunk.usage_metadata,
  });
}

function withNoStreamTags(config: RunnableConfig): RunnableConfig {
  const tags = [...new Set([...(config.tags ?? []), ...NOSTREAM_TAGS])];
  return { ...config, tags };
}

function hasStreamDelta(chunk: AIMessageChunk): boolean {
  if (typeof chunk.content === "string" && chunk.content.length > 0) {
    return true;
  }
  if (Array.isArray(chunk.content) && chunk.content.length > 0) {
    return true;
  }
  if (chunk.tool_call_chunks?.length) return true;
  if (chunk.tool_calls?.length) return true;
  if (chunk.invalid_tool_calls?.length) return true;
  return false;
}

function chunkToAIMessage(chunk: AIMessageChunk, messageId: string): AIMessage {
  return new AIMessage({
    id: messageId,
    content: chunk.content,
    tool_calls: chunk.tool_calls,
    invalid_tool_calls: chunk.invalid_tool_calls,
    additional_kwargs: chunk.additional_kwargs,
    usage_metadata: chunk.usage_metadata,
    response_metadata: chunk.response_metadata,
  });
}

/** 流式调用 Chat 模型，逐增量 chunk pushMessage。用于 llm-chat 子图节点。 */
export async function streamChat(
  model: ChatModel,
  input: BaseMessage[],
  config: RunnableConfig,
): Promise<AIMessage> {
  const stream = await model.stream(input, withNoStreamTags(config));
  let accumulated: AIMessageChunk | undefined;
  let messageId: string | undefined;
  const contentChannel = createStreamTextChannel();

  for await (const chunk of stream) {
    const normalized = normalizeChunkForConcat(chunk, contentChannel);
    accumulated = accumulated ? accumulated.concat(normalized) : normalized;
    const id = accumulated.id ?? messageId ?? (messageId = nanoid());
    messageId = id;
    if (hasStreamDelta(normalized)) {
      pushMessage(chunkToAIMessage(normalized, id), config);
    }
  }

  if (!accumulated) {
    throw new Error("Chat stream returned no chunks");
  }

  const finalId = accumulated.id ?? messageId ?? nanoid();
  return chunkToAIMessage(accumulated, finalId);
}
