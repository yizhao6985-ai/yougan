/**
 * LangGraph tool 返回 Command：写入 ToolMessage 并可选更新 state。
 */
import { Command } from "@langchain/langgraph";
import { ToolMessage } from "@langchain/core/messages";
import type { ToolRunnableConfig } from "@langchain/core/tools";

export function toolCommand(
  config: ToolRunnableConfig | Record<string, unknown>,
  content: string,
  updates: Record<string, unknown> = {},
): Command {
  const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
  return new Command({
    update: {
      messages: [new ToolMessage({ content, tool_call_id: toolCallId })],
      ...updates,
    },
  });
}
