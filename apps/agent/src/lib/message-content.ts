function contentPartToText(part: unknown): string {
  if (typeof part === "string") return part;
  if (!part || typeof part !== "object") return "";

  const block = part as {
    type?: string;
    text?: unknown;
    content?: unknown;
  };

  if (typeof block.text === "string") return block.text;
  if (typeof block.content === "string") return block.content;
  return "";
}

/** 从 LangChain 消息 / 模型响应 content 中提取纯文本。 */
export function messageContentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (content == null) return "";

  if (Array.isArray(content)) {
    return content.map(contentPartToText).join("");
  }

  if (typeof content === "object") {
    return contentPartToText(content);
  }

  return "";
}

export function truncateMessageContent(content: unknown, maxLength = 500): string {
  return messageContentToText(content).trim().slice(0, maxLength);
}
