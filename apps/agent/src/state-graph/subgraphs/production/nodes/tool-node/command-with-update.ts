import { ToolMessage } from "@langchain/core/messages";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";

/** Tool 返回：写入 ToolMessage 并合并 state patch。 */
export function commandWithUpdate(
  config: ToolRunnableConfig | Record<string, unknown>,
  content: string,
  update: Record<string, unknown> = {},
): Command {
  const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
  return new Command({
    update: {
      messages: [new ToolMessage({ content, tool_call_id: toolCallId })],
      ...update,
    },
  });
}
