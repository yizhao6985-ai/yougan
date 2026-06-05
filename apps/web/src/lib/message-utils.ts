import { AIMessage } from "@langchain/core/messages";
import type { Message } from "@langchain/langgraph-sdk";

import { isInternalOpeningModeSystemMessage } from "@/lib/opening-mode-internal";

type MessageContent = Message["content"];

type ContentBlockLike = {
  type?: string;
  text?: string;
};

type MessageWithBlocks = Message & {
  contentBlocks?: ContentBlockLike[];
};

function countImageParts(content: MessageContent): number {
  if (!Array.isArray(content)) return 0;
  return content.filter((part) => {
    if (!part || typeof part !== "object") return false;
    return (part as { type?: string }).type === "image_url";
  }).length;
}

export function humanMessageDisplayText(content: MessageContent): string {
  const text = messageContentToText(content);
  const imageCount = countImageParts(content);
  if (imageCount === 0) return text;
  const label =
    imageCount === 1 ? "[1 张参考图]" : `[${imageCount} 张参考图]`;
  return text ? `${label} ${text}` : label;
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

  const content = message.content;
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  let text = "";

  for (const part of content) {
    if (typeof part === "string") {
      text += part;
      continue;
    }
    const block = part as ContentBlockLike & Record<string, unknown>;
    if (block.type === "text") {
      text += block.text ?? "";
    } else if (typeof block.text === "string") {
      text += block.text;
    } else if (typeof block.content === "string") {
      text += block.content;
    }
  }

  return text;
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

/** 按 message id 合并（与 LangGraph messagesStateReducer 一致：同 id 替换）。 */
export function mergeMessagesById(
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
    if (index !== undefined) {
      merged[index] = message;
    } else {
      indexById.set(id, merged.length);
      merged.push(message);
    }
  }

  return merged;
}

/**
 * 将 LangGraph updates 事件（节点内 pushMessage / 局部写入）合并进 values 形态的全量 state。
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
      messages = mergeMessagesById(messages, list);
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
      const content = humanMessageDisplayText(message.content);
      if (content) {
        items.push({
          id: message.id ?? `human-${index}`,
          kind: "human",
          content,
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

      const text = extractAIMessageText(message);
      const isStreamingAi =
        isLoading &&
        index === lastAiMessageIndex &&
        index > lastHumanIndex;

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
