import {
  AIMessage,
  HumanMessage,
  ToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";

import { messageContentToText } from "#agent/messages/message-content.js";

/** 工具执行过程消息：ToolMessage、仅含 tool_calls 无正文的 AIMessage */
export function isToolInternalMessage(message: BaseMessage): boolean {
  if (ToolMessage.isInstance(message)) return true;

  if (AIMessage.isInstance(message)) {
    const hasTools = (message.tool_calls?.length ?? 0) > 0;
    const text = messageContentToText(message.content).trim();
    return hasTools && !text;
  }

  return false;
}

/** 面向用户的语义消息：Human、有正文的 AI 回复 */
export function isSemanticMessage(message: BaseMessage): boolean {
  if (HumanMessage.isInstance(message)) return true;

  if (AIMessage.isInstance(message)) {
    if (isToolInternalMessage(message)) return false;
    return messageContentToText(message.content).trim().length > 0;
  }

  return false;
}

export function semanticMessages(messages: BaseMessage[]): BaseMessage[] {
  return messages.filter(isSemanticMessage);
}

export function semanticMessageChars(messages: BaseMessage[]): number {
  return semanticMessages(messages).reduce(
    (count, message) => count + messageContentToText(message.content).length,
    0,
  );
}
