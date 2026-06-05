import type { Message } from "@langchain/langgraph-sdk";

/** 与 agent opening/prepare-turn 保持一致，勿改 */
export const OPENING_STRUCTURED_PROMPT_MESSAGE_ID =
  "inspiration-structured-prompt";

function messageText(content: Message["content"]): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part) {
        return typeof part.text === "string" ? part.text : "";
      }
      return "";
    })
    .join("");
}

export function isInternalOpeningModeSystemMessage(message: Message): boolean {
  if (message.id === OPENING_STRUCTURED_PROMPT_MESSAGE_ID) return true;
  if (message.type !== "system") return false;
  return messageText(message.content).trim().startsWith("你是 Yougan 灵感模式助手");
}
