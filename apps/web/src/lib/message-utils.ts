import { AIMessage } from "@langchain/core/messages";
import type { Message } from "@langchain/langgraph-sdk";
import {
  buildHumanMessageContent,
  extractAttachmentAssetsFromContent,
  extractPreviewSelectionsFromContent,
  isDefaultAttachmentPromptText,
  isTurnActivityMessage,
  isTurnBriefingAiMessage,
  parseTurnBriefingExcerptFromMessage,
  parseTurnActivityFromMessage,
  type HumanPreviewSelection,
  type TurnActivityStatus,
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
  previewSelections: HumanPreviewSelection[];
} {
  // 历史消息可能仍含 asset parts；展示时忽略附件，只保留文本与预览引用
  const legacyAttachmentCount =
    extractAttachmentAssetsFromContent(content).length;
  const previewSelections = extractPreviewSelectionsFromContent(content);
  let text = messageContentToText(content).trim();
  if (isDefaultAttachmentPromptText(text, legacyAttachmentCount)) {
    text = "";
  }
  return { text, previewSelections };
}

/** 提交给 LangGraph 的 human 消息；仅文本 + 预览引用，不再附带素材附件。 */
export function buildSubmitHumanMessage(
  text: string,
  previewSelections: HumanPreviewSelection[] = [],
): Message {
  return {
    type: "human",
    content: buildHumanMessageContent(
      text,
      [],
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

type AiMessageWithTools = Message & {
  tool_calls?: { id?: string; name?: string; args?: Record<string, unknown> }[];
  invalid_tool_calls?: { id?: string; name?: string; args?: Record<string, unknown> }[];
};

export type RenderItem =
  | {
      id: string;
      kind: "human";
      content: string;
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
      kind: "activity";
      label: string;
      detail?: string | null;
      status: TurnActivityStatus;
    }
  | {
      id: string;
      kind: "briefing";
      body: string;
      excerpt?: string | null;
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
 * 与 streamMode `messages-tuple` 并用：正文走 messages 通道，updates 合并 human / AI tool_calls / activity 等。
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

const ACTIVITY_STATUS_RANK: Record<TurnActivityStatus, number> = {
  running: 0,
  failed: 1,
  done: 2,
};

function shouldPreferActivityStatus(
  prev: TurnActivityStatus,
  next: TurnActivityStatus,
): boolean {
  return ACTIVITY_STATUS_RANK[next] >= ACTIVITY_STATUS_RANK[prev];
}

/** 合并 stream.messages（流式）与 values.messages（节点一次性写入，如 finalizeProduction） */
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
  const activityIndexByStableId = new Map<string, number>();
  const lastHumanIndex = findLastMessageIndex(messages, "human");
  const lastAiMessageIndex = findLastMessageIndex(messages, "ai");

  for (let index = 0; index < messages.length; index++) {
    const message = messages[index];

    if (message.type === "human") {
      const { text, previewSelections } = parseHumanMessageForDisplay(
        message.content,
      );
      if (text || previewSelections.length > 0) {
        items.push({
          id: message.id ?? `human-${index}`,
          kind: "human",
          content: text,
          previewSelections,
        });
      }
      continue;
    }

    if (message.type === "system") {
      if (isInternalOpeningModeSystemMessage(message)) continue;
      if (isTurnActivityMessage(message)) {
        const activity = parseTurnActivityFromMessage(message);
        if (activity) {
          const item: RenderItem = {
            id: message.id ?? `activity-${index}`,
            kind: "activity",
            label: activity.label,
            detail: activity.detail,
            status: activity.status,
          };
          const existingIndex = activityIndexByStableId.get(activity.id);
          if (existingIndex !== undefined) {
            const existing = items[existingIndex];
            if (
              existing?.kind === "activity" &&
              shouldPreferActivityStatus(existing.status, activity.status)
            ) {
              items[existingIndex] = item;
            }
          } else {
            activityIndexByStableId.set(activity.id, items.length);
            items.push(item);
          }
        }
        continue;
      }
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
      const messageId = message.id ?? `ai-${index}`;

      if (isTurnBriefingAiMessage(message)) {
        const text = extractAIMessageText(message);
        const isStreamingBriefing =
          isLoading &&
          index === lastAiMessageIndex &&
          index > lastHumanIndex;

        if (text || isStreamingBriefing) {
          items.push({
            id: messageId,
            kind: "briefing",
            body: text,
            excerpt: parseTurnBriefingExcerptFromMessage(message),
            isStreaming: isStreamingBriefing,
          });
        }
        continue;
      }

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

/** 回合末方向 chips 的挂载点：最近一条 human 之后的最后一个 ai / activity（含历史 briefing） */
export function findTurnDirectionsAnchorIndex(items: RenderItem[]): number {
  let lastHumanIndex = -1;
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (items[i]?.kind === "human") {
      lastHumanIndex = i;
      break;
    }
  }
  if (lastHumanIndex === -1) return -1;

  for (let i = items.length - 1; i > lastHumanIndex; i -= 1) {
    const kind = items[i]?.kind;
    if (kind === "briefing" || kind === "ai" || kind === "activity") {
      return i;
    }
  }
  return -1;
}
