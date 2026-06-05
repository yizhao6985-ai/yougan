/** LangChain AI 消息解析（tool_calls 等） */
import { AIMessage, type BaseMessage } from "@langchain/core/messages";

export function lastAiMessageHasToolCalls(
  messages: BaseMessage[] | undefined,
): boolean {
  const last = messages?.at(-1);
  if (!AIMessage.isInstance(last)) return false;
  return (last.tool_calls?.length ?? 0) > 0;
}
