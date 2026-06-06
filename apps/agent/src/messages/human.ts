/** LangChain human 消息解析（条数、文本、图片 content part） */
import { HumanMessage, type BaseMessage } from "@langchain/core/messages";
import {
  extractImagePartsFromContent,
  type HumanImageContentPart,
} from "./content-parts.js";
import { messageContentToText } from "./message-content.js";

/** 按顺序返回全部 human 消息的原始 content；条数用 `.length`。 */
export function getHumanMessageContents(
  messages: BaseMessage[] | undefined,
): HumanMessage["content"][] {
  if (!messages?.length) return [];
  return messages
    .filter((message): message is HumanMessage =>
      HumanMessage.isInstance(message),
    )
    .map((message) => message.content);
}

export function getLatestHumanMessageText(
  messages: BaseMessage[] | undefined,
): string {
  const content = getHumanMessageContents(messages).at(-1);
  if (content === undefined) return "";
  return messageContentToText(content).trim();
}

/** 最近一条 human 消息中的全部图片 content part（原始结构）。 */
export function getLatestHumanMessageImageParts(
  messages: BaseMessage[] | undefined,
): HumanImageContentPart[] {
  const content = getHumanMessageContents(messages).at(-1);
  if (content === undefined) return [];
  return extractImagePartsFromContent(content);
}
