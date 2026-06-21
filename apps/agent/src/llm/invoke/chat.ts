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
import type { MeteringModelId } from "@yougan/domain";

import { sanitizeMessagesForTextChat } from "#agent/messages/llm-input.js";
import { DASHSCOPE_MODELS } from "#agent/llm/providers/catalog.js";
import {
  getRunMeteringAccumulator,
  recordRunMeteringUsageIfMissing,
  resolveDashScopeMeteringModelId,
  withMeteringCallbacks,
} from "./metering.js";
import { LLM_TIMEOUT_MS, withLlmRetry } from "./timeout.js";

/** 关闭 LLM callback 自动 messages 流，改由 pushMessage 推增量 chunk。 */
const NOSTREAM_TAGS = ["nostream"] as const;

export type ChatModel = Runnable<BaseMessage[], AIMessageChunk, RunnableConfig>;

export type StreamChatOptions = {
  meteringModelId?: MeteringModelId;
};

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
  options?: StreamChatOptions,
): Promise<AIMessage> {
  const meteringModelId =
    options?.meteringModelId ??
    resolveDashScopeMeteringModelId(DASHSCOPE_MODELS.chat);
  const messages = sanitizeMessagesForTextChat(input);
  const attemptState = { hadStreamDelta: false };

  return withLlmRetry({
    parentSignal: config.signal,
    timeoutMs: LLM_TIMEOUT_MS.chat,
    canRetry: () => !attemptState.hadStreamDelta,
    run: async (signal) => {
      attemptState.hadStreamDelta = false;
      const callCountBefore = getRunMeteringAccumulator(config).callCount;
      const meteredConfig = withMeteringCallbacks(
        { ...withNoStreamTags(config), signal },
        meteringModelId,
        config,
      );
      const stream = await model.stream(messages, meteredConfig);
      let accumulated: AIMessageChunk | undefined;
      let messageId: string | undefined;

      for await (const chunk of stream) {
        accumulated = accumulated ? accumulated.concat(chunk) : chunk;
        const id = accumulated.id ?? messageId ?? (messageId = nanoid());
        messageId = id;
        if (hasStreamDelta(chunk)) {
          attemptState.hadStreamDelta = true;
          pushMessage(chunkToAIMessage(chunk, id), config);
        }
      }

      if (!accumulated) {
        throw new Error("Chat stream returned no chunks");
      }

      const finalId = accumulated.id ?? messageId ?? nanoid();
      const message = chunkToAIMessage(accumulated, finalId);
      if (getRunMeteringAccumulator(config).callCount === callCountBefore) {
        recordRunMeteringUsageIfMissing(
          config,
          meteringModelId,
          message.usage_metadata,
        );
      }
      return message;
    },
  });
}
