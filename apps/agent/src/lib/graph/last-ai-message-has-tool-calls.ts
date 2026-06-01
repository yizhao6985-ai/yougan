/**
 * 判断 messages 最后一条 AI 消息是否含 tool_calls（用于 after-llm 条件边）。
 */
import type { AgentStateType } from "../../state.js";

export function lastAiMessageHasToolCalls(state: AgentStateType): boolean {
  const messages = state.messages ?? [];
  const last = messages.at(-1);
  if (!last || typeof last !== "object") return false;
  const toolCalls =
    "tool_calls" in last &&
    Array.isArray((last as { tool_calls?: unknown }).tool_calls)
      ? (last as { tool_calls: unknown[] }).tool_calls
      : null;
  return (toolCalls?.length ?? 0) > 0;
}
