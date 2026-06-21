import { AIMessage } from "@langchain/core/messages";
import type { Message } from "@langchain/langgraph-sdk";
import {
  buildHumanMessageContent,
  extractAttachmentAssetsFromContent,
  extractPreviewSelectionsFromContent,
  isDefaultAttachmentPromptText,
  type HumanAttachmentAsset,
  type HumanPreviewSelection,
} from "@yougan/domain";
import { messageContentToText as coreMessageContentToText } from "@/lib/message-content";

import { isInternalOpeningModeSystemMessage } from "@/lib/opening-mode-internal";

type MessageContent = Message["content"];

type ContentBlockLike = {
  type?: string;
  text?: string;
};

type MessageWithBlocks = Message & {
  contentBlocks?: ContentBlockLike[];
};

export function parseHumanMessageForDisplay(content: MessageContent): {
  text: string;
  attachments: HumanAttachmentAsset[];
  previewSelections: HumanPreviewSelection[];
} {
  const attachments = extractAttachmentAssetsFromContent(content);
  const previewSelections = extractPreviewSelectionsFromContent(content);
  let text = messageContentToText(content).trim();
  if (isDefaultAttachmentPromptText(text, attachments.length)) {
    text = "";
  }
  return { text, attachments, previewSelections };
}

/** 提交给 LangGraph 的 human 消息；domain asset part 无 type，与 SDK MessageContent 约定兼容。 */
export function buildSubmitHumanMessage(
  text: string,
  attachments: HumanAttachmentAsset[] = [],
  previewSelections: HumanPreviewSelection[] = [],
): Message {
  return {
    type: "human",
    content: buildHumanMessageContent(
      text,
      attachments,
      previewSelections,
    ) as MessageContent,
  };
}

export function messageContentToText(content: MessageContent): string {
  return extractAIMessageText({ type: "ai", content } as Message);
}

export function extractAIMessageText(message: MessageWithBlocks): string {
  if (AIMessage.isInstance(message)) {
    const text = message.contentBlocks
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
    if (text) return text;
  }

  if (Array.isArray(message.contentBlocks) && message.contentBlocks.length > 0) {
    const text = message.contentBlocks
      .filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("");
    if (text) return text;
  }

  return coreMessageContentToText(message.content);
}

type ToolCallLike = {
  id?: string;
  name?: string;
  args?: Record<string, unknown>;
  error?: string;
};

type AiMessageWithTools = Message & {
  tool_calls?: ToolCallLike[];
  invalid_tool_calls?: ToolCallLike[];
};

function collectToolResults(messages: Message[]) {
  const map = new Map<string, Message>();
  for (const message of messages) {
    if (message.type === "tool" && message.tool_call_id) {
      map.set(message.tool_call_id, message);
    }
  }
  return map;
}

function parseToolCallArgs(args: unknown): Record<string, unknown> {
  if (args && typeof args === "object" && !Array.isArray(args)) {
    return args as Record<string, unknown>;
  }
  return {};
}

function readToolResult(message: Message): { output?: unknown; error?: string } {
  const status = (message as { status?: string }).status;
  if (status === "error") {
    return {
      error: messageContentToText(message.content) || "工具执行失败",
    };
  }

  const content = message.content;
  if (typeof content === "string") {
    return { output: content };
  }

  return { output: content };
}

function pushToolItems(
  items: RenderItem[],
  toolCalls: ToolCallLike[],
  options: {
    messageId: string;
    messageIndex: number;
    lastHumanIndex: number;
    isLoading: boolean;
    toolResultsById: Map<string, Message>;
  },
) {
  for (let toolIndex = 0; toolIndex < toolCalls.length; toolIndex += 1) {
    const call = toolCalls[toolIndex];
    const callId = call.id ?? `${options.messageId}-tool-${toolIndex}`;
    const resultMessage = call.id
      ? options.toolResultsById.get(call.id)
      : undefined;
    const { output, error } = resultMessage
      ? readToolResult(resultMessage)
      : { output: undefined, error: call.error };
    const isStreaming =
      options.isLoading &&
      options.messageIndex > options.lastHumanIndex &&
      !resultMessage &&
      !error;

    items.push({
      id: callId,
      kind: "tool",
      toolName: call.name ?? "unknown_tool",
      toolInput: parseToolCallArgs(call.args),
      toolOutput: output,
      toolError: error,
      isStreaming,
    });
  }
}

export type RenderItem =
  | {
      id: string;
      kind: "human";
      content: string;
      attachments: HumanAttachmentAsset[];
      previewSelections: HumanPreviewSelection[];
    }
  | {
      id: string;
      kind: "ai";
      content: string;
      isStreaming?: boolean;
      isInterrupted?: boolean;
    }
  | {
      id: string;
      kind: "tool";
      toolName: string;
      toolInput: Record<string, unknown>;
      toolOutput?: unknown;
      toolError?: string;
      isStreaming?: boolean;
    }
  | {
      id: string;
      kind: "system";
      content: string;
    };

function mergeAiMessageFromUpdate(prev: Message, incoming: Message): Message {
  const prevAi = prev as AiMessageWithTools;
  const incomingAi = incoming as AiMessageWithTools;
  const prevWithBlocks = prev as MessageWithBlocks;
  const incomingWithBlocks = incoming as MessageWithBlocks;
  const prevText = extractAIMessageText(prev);
  const incomingText = extractAIMessageText(incoming);
  const keepPrevBody = prevText.length >= incomingText.length;

  return {
    ...prev,
    ...incoming,
    content: keepPrevBody ? prev.content : incoming.content,
    contentBlocks: keepPrevBody
      ? prevWithBlocks.contentBlocks
      : incomingWithBlocks.contentBlocks,
    tool_calls: incomingAi.tool_calls?.length
      ? incomingAi.tool_calls
      : prevAi.tool_calls,
    invalid_tool_calls: incomingAi.invalid_tool_calls?.length
      ? incomingAi.invalid_tool_calls
      : prevAi.invalid_tool_calls,
  } as MessageWithBlocks as Message;
}

function mergeMessagesFromUpdates(
  existing: Message[],
  incoming: Message[],
): Message[] {
  const merged = [...existing];
  const indexById = new Map<string, number>();
  for (let i = 0; i < merged.length; i += 1) {
    const id = merged[i]?.id;
    if (id) indexById.set(id, i);
  }

  for (const message of incoming) {
    const id = message.id;
    if (!id) {
      merged.push(message);
      continue;
    }

    const index = indexById.get(id);
    if (index === undefined) {
      indexById.set(id, merged.length);
      merged.push(message);
      continue;
    }

    const prev = merged[index];
    // messages-tuple 负责流式正文；updates 同 id 的 AI 只补 tool_calls，正文取更长的一份。
    if (message.type === "ai" && prev?.type === "ai") {
      merged[index] = mergeAiMessageFromUpdate(prev, message);
      continue;
    }

    merged[index] = message;
  }

  return merged;
}

import {
  EMPTY_TURN_RUNTIME,
  mergeProfileState,
  mergeTurnRuntime,
  type TurnRuntime,
  type WorkProfile,
} from "@yougan/domain";

/**
 * 将 LangGraph updates 事件合并进 values。
 * 与 streamMode `messages-tuple` 并用：正文走 messages 通道，updates 只合并 tool/human 与 AI 的 tool_calls。
 */
export function applyGraphUpdatesToValues<T extends { messages?: Message[] }>(
  prev: T,
  update: Record<string, unknown>,
): T {
  let messages = [...(prev.messages ?? [])];
  let next = { ...prev } as T;

  for (const [key, raw] of Object.entries(update)) {
    if (key === "__metadata__") continue;
    if (!raw || typeof raw !== "object") continue;

    const patch = raw as Record<string, unknown>;
    if ("messages" in patch) {
      const incoming = patch.messages;
      const list = (
        Array.isArray(incoming) ? incoming : incoming != null ? [incoming] : []
      ) as Message[];
      messages = mergeMessagesFromUpdates(messages, list);
      continue;
    }

    if ("profile" in patch && patch.profile && typeof patch.profile === "object") {
      (next as { profile?: WorkProfile }).profile = mergeProfileState(
        (next as { profile?: WorkProfile }).profile,
        patch.profile as WorkProfile,
      );
      const { messages: _messages, profile: _profile, ...rest } = patch;
      if (Object.keys(rest).length > 0) {
        next = { ...next, ...(rest as Partial<T>) };
      }
      continue;
    }

    if ("turn" in patch && patch.turn && typeof patch.turn === "object") {
      const prevTurn = (
        (next as { turn?: TurnRuntime }).turn ?? EMPTY_TURN_RUNTIME
      ) as TurnRuntime;
      (next as { turn?: TurnRuntime }).turn = mergeTurnRuntime(
        prevTurn,
        patch.turn as Partial<TurnRuntime>,
      );
      const { messages: _messages, turn: _turn, ...rest } = patch;
      if (Object.keys(rest).length > 0) {
        next = { ...next, ...(rest as Partial<T>) };
      }
      continue;
    }

    next = { ...next, ...(patch as Partial<T>) };
  }

  return { ...next, messages };
}

function findLastMessageIndex(
  messages: Message[],
  type: "human" | "ai",
): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.type === type) return i;
  }
  return -1;
}

/** 合并 stream.messages（流式）与 values.messages（节点一次性写入，如 summarizeProduction） */
export function mergeChatMessages(
  streamMessages: Message[],
  valuesMessages: Message[] | undefined,
): Message[] {
  if (!valuesMessages?.length) return streamMessages;
  return mergeMessagesFromUpdates(streamMessages, valuesMessages);
}

export function buildRenderItems(
  messages: Message[],
  isLoading: boolean,
  interruptedMessageIds: string[] = [],
): RenderItem[] {
  const interrupted = new Set(interruptedMessageIds);
  const items: RenderItem[] = [];
  const lastHumanIndex = findLastMessageIndex(messages, "human");
  const lastAiMessageIndex = findLastMessageIndex(messages, "ai");
  const toolResultsById = collectToolResults(messages);

  for (let index = 0; index < messages.length; index++) {
    const message = messages[index];

    if (message.type === "human") {
      const { text, attachments, previewSelections } =
        parseHumanMessageForDisplay(message.content);
      if (text || attachments.length > 0 || previewSelections.length > 0) {
        items.push({
          id: message.id ?? `human-${index}`,
          kind: "human",
          content: text,
          attachments,
          previewSelections,
        });
      }
      continue;
    }

    if (message.type === "system") {
      if (isInternalOpeningModeSystemMessage(message)) continue;
      const content = messageContentToText(message.content);
      if (content) {
        items.push({
          id: message.id ?? `system-${index}`,
          kind: "system",
          content,
        });
      }
      continue;
    }

    if (message.type === "tool") {
      continue;
    }

    if (message.type === "ai") {
      const aiMessage = message as AiMessageWithTools;
      const messageId = message.id ?? `ai-${index}`;

      const text = extractAIMessageText(message);
      const isStreamingAi =
        isLoading &&
        index === lastAiMessageIndex &&
        index > lastHumanIndex;

      pushToolItems(
        items,
        [...(aiMessage.tool_calls ?? []), ...(aiMessage.invalid_tool_calls ?? [])],
        {
          messageId,
          messageIndex: index,
          lastHumanIndex,
          isLoading,
          toolResultsById,
        },
      );

      if (text || isStreamingAi || interrupted.has(messageId)) {
        items.push({
          id: messageId,
          kind: "ai",
          content: text,
          isStreaming: isStreamingAi,
          isInterrupted: interrupted.has(messageId),
        });
      }
    }
  }

  return items;
}
