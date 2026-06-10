/**
 * 被用户中断的 assistant 消息卫生：剥离 tool_calls，跳过孤立 tool 消息。
 */
import {
  AIMessage,
  type BaseMessage,
  ToolMessage,
} from "@langchain/core/messages";

function isInterruptedAiMessage(
  message: BaseMessage,
  interruptedIds: ReadonlySet<string>,
): boolean {
  if (!AIMessage.isInstance(message)) return false;
  const id = message.id;
  return typeof id === "string" && interruptedIds.has(id);
}

/**
 * 为 LLM 对话准备 messages：中断的 ai 去掉 tool_calls；其后孤立 tool 丢弃。
 */
export function stripInterruptedMessagesForLlm(
  messages: BaseMessage[],
  interruptedMessageIds: string[] | undefined,
): BaseMessage[] {
  const interrupted = new Set(interruptedMessageIds ?? []);
  if (interrupted.size === 0) return messages;

  const result: BaseMessage[] = [];
  let skipOrphanTools = false;

  for (const message of messages) {
    if (isInterruptedAiMessage(message, interrupted)) {
      result.push(
        new AIMessage({
          id: message.id,
          name: message.name,
          content: message.content,
          additional_kwargs: message.additional_kwargs,
          response_metadata: message.response_metadata,
        }),
      );
      skipOrphanTools = true;
      continue;
    }

    if (ToolMessage.isInstance(message)) {
      if (skipOrphanTools) continue;
      result.push(message);
      continue;
    }

    skipOrphanTools = false;
    result.push(message);
  }

  return result;
}
