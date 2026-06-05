/** 取最新一条 human 消息的纯文本 */
import type { BaseMessage } from "@langchain/core/messages";

import { messageContentToText } from "../message-content.js";

export function getLatestHumanMessageText(
  messages: BaseMessage[] | undefined,
): string {
  if (!messages?.length) return "";

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message?.getType?.() === "human" || message?._getType?.() === "human") {
      return messageContentToText(message.content).trim();
    }
  }
  return "";
}
