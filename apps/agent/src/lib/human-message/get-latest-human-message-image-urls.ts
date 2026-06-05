/** 取最新一条 human 消息附带的图片 URL 列表 */
import type { BaseMessage } from "@langchain/core/messages";

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
    if (message.getType() !== "human") continue;
    return extractImageUrlsFromHumanContent(message.content);
  }
  return [];
}
