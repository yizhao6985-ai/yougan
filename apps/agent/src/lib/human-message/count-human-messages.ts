import type { BaseMessage } from "@langchain/core/messages";

export function countHumanMessages(
  messages: BaseMessage[] | undefined,
): number {
  if (!messages?.length) return 0;
  return messages.filter(
    (message) =>
      message?.getType?.() === "human" || message?._getType?.() === "human",
  ).length;
}
