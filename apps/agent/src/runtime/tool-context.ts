/**
 * LangGraph tool 内读取与更新 state 的辅助函数。
 */
import { Command } from "@langchain/langgraph";
import { ToolMessage } from "@langchain/core/messages";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { getCurrentTaskInput } from "@langchain/langgraph";

import { appendProfileReferences } from "@yougan/domain";

import { parseProfile } from "./state-readers.js";
import type { AgentStateType } from "#agent/state.js";
import type { ReferenceItem, WorkProfile } from "@yougan/domain";

export function getState(): AgentStateType {
  return getCurrentTaskInput() as AgentStateType;
}

export function appendReferences(
  state: AgentStateType,
  refs: ReferenceItem[],
): WorkProfile {
  return appendProfileReferences(parseProfile(state), refs);
}

/** LangGraph tool 返回 Command：写入 ToolMessage 并可选更新 state。 */
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
