import { AIMessage, ToolMessage, type BaseMessage } from "@langchain/core/messages";

/**
 * 最近一条 AIMessage 是否仍有未执行的 tool_calls。
 * 不能只看 messages 末条：streamChat + pushMessage 会先写入 AI，activity 等 SystemMessage
 * 再 append 到末尾，toolsCondition 会误判为无 tool_calls。
 */
export function hasPendingAiToolCalls(messages: BaseMessage[]): boolean {
  const answered = new Set(
    messages
      .filter((message) => ToolMessage.isInstance(message))
      .map((message) => message.tool_call_id)
      .filter((id): id is string => Boolean(id)),
  );

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (!AIMessage.isInstance(message)) continue;
    return (
      message.tool_calls?.some((call) => call.id && !answered.has(call.id)) ??
      false
    );
  }

  return false;
}
