import { AIMessage } from "@langchain/core/messages";
import type { Message } from "@langchain/langgraph-sdk";

import { isInternalInspirationSystemMessage } from "@/lib/inspiration-internal";

type MessageContent = Message["content"];

type ContentBlockLike = {
  type?: string;
  text?: string;
  reasoning?: string;
  thinking?: string;
};

type MessageWithBlocks = Message & {
  contentBlocks?: ContentBlockLike[];
};

export function messageContentToText(content: MessageContent): string {
  return extractAIMessageBlocks({ type: "ai", content } as Message).text;
}

export function extractAIMessageBlocks(message: MessageWithBlocks): {
  text: string;
  reasoning: string;
} {
  if (AIMessage.isInstance(message)) {
    const text = message.contentBlocks
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
    const reasoning = message.contentBlocks
      .filter((block) => block.type === "reasoning")
      .map((block) => block.reasoning)
      .join("");
    if (text || reasoning) return { text, reasoning };
  }

  if (Array.isArray(message.contentBlocks) && message.contentBlocks.length > 0) {
    const text = message.contentBlocks
      .filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("");
    const reasoning = message.contentBlocks
      .filter((block) => block.type === "reasoning")
      .map((block) => block.reasoning ?? "")
      .join("");
    if (text || reasoning) return { text, reasoning };
  }

  const content = message.content;
  if (typeof content === "string") {
    return { text: content, reasoning: "" };
  }

  if (!Array.isArray(content)) {
    return { text: "", reasoning: "" };
  }

  let text = "";
  let reasoning = "";

  for (const part of content) {
    if (typeof part === "string") {
      text += part;
      continue;
    }
    const block = part as ContentBlockLike & Record<string, unknown>;
    if (block.type === "text") {
      text += block.text ?? "";
    } else if (block.type === "reasoning") {
      reasoning += block.reasoning ?? "";
    } else if (block.type === "thinking") {
      reasoning += block.thinking ?? "";
    } else if (typeof block.text === "string") {
      text += block.text;
    } else if (typeof block.content === "string") {
      text += block.content;
    }
  }

  const additional = message.additional_kwargs;
  if (!reasoning && typeof additional?.reasoning_content === "string") {
    reasoning = additional.reasoning_content;
  }

  return { text, reasoning };
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
      reasoning?: string;
      isStreaming?: boolean;
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
): RenderItem[] {
  const items: RenderItem[] = [];
  const lastHumanIndex = findLastMessageIndex(messages, "human");
  const lastAiMessageIndex = findLastMessageIndex(messages, "ai");
  const toolResultsById = collectToolResults(messages);

  for (let index = 0; index < messages.length; index++) {
    const message = messages[index];

    if (message.type === "human") {
      const content = messageContentToText(message.content);
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
      if (isInternalInspirationSystemMessage(message)) continue;
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

      const { text, reasoning } = extractAIMessageBlocks(message);
      const isStreamingAi =
        isLoading &&
        index === lastAiMessageIndex &&
        index > lastHumanIndex;

      if (text || reasoning || isStreamingAi) {
        items.push({
          id: messageId,
          kind: "ai",
          content: text,
          reasoning: reasoning || undefined,
          isStreaming: isStreamingAi,
        });
      }
    }
  }

  return items;
}
