/** LangChain human 消息解析（条数、文本、图片 URL） */
import { HumanMessage, type BaseMessage } from "@langchain/core/messages";
import { messageContentToText } from "@yougan/domain";

export function countHumanMessages(
  messages: BaseMessage[] | undefined,
): number {
  if (!messages?.length) return 0;
  return messages.filter((message) => HumanMessage.isInstance(message)).length;
}

export function getLatestHumanMessageText(
  messages: BaseMessage[] | undefined,
): string {
  if (!messages?.length) return "";

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (HumanMessage.isInstance(message)) {
      return messageContentToText(message.content).trim();
    }
  }
  return "";
}

function extractImageUrlsFromHumanContent(content: unknown): string[] {
  if (!Array.isArray(content)) return [];

  const urls: string[] = [];
  for (const part of content) {
    if (!part || typeof part !== "object") continue;
    const block = part as {
      type?: string;
      image_url?: string | { url?: string };
    };
    if (block.type !== "image_url") continue;

    const raw = block.image_url;
    const url = typeof raw === "string" ? raw : raw?.url;
    if (url) urls.push(url);
  }
  return urls;
}

export function getLatestHumanMessageImageUrls(
  messages: BaseMessage[] | undefined,
): string[] {
  if (!messages?.length) return [];

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!HumanMessage.isInstance(message)) continue;
    return extractImageUrlsFromHumanContent(message.content);
  }
  return [];
}
