/** LangChain human 消息解析（条数、文本、附件 content part） */
import { HumanMessage, type BaseMessage } from "@langchain/core/messages";
import {
  extractAttachmentAssetsFromContent,
  extractPreviewSelectionsFromContent,
  type HumanAttachmentAsset,
  type HumanPreviewSelection,
} from "@yougan/domain";
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

/** 最近一条 human 消息的 id（Activity upsert 锚点） */
export function getLatestHumanMessageId(
  messages: BaseMessage[] | undefined,
): string | null {
  if (!messages?.length) return null;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (HumanMessage.isInstance(message) && message.id) {
      return message.id;
    }
  }
  return null;
}

/** 最近一条 human 消息中的全部附件（图片、音频、视频等）。 */
export function getLatestHumanMessageAttachments(
  messages: BaseMessage[] | undefined,
): HumanAttachmentAsset[] {
  const content = getHumanMessageContents(messages).at(-1);
  if (content === undefined) return [];
  return extractAttachmentAssetsFromContent(content);
}

/** 最近一条 human 消息中的成稿划词引用。 */
export function getLatestHumanMessagePreviewSelections(
  messages: BaseMessage[] | undefined,
): HumanPreviewSelection[] {
  const content = getHumanMessageContents(messages).at(-1);
  if (content === undefined) return [];
  return extractPreviewSelectionsFromContent(content);
}
