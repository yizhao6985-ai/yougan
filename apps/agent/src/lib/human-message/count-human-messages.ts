/** 统计 thread 内 human 消息条数（开屏 / 自动标题等门禁） */
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
