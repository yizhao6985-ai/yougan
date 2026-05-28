/**
 * 跨 agent 共享的工具基础设施。
 *
 * getState()    — 在 tool 内读取当前 LangGraph state
 * toolCommand() — 返回 Command，同时写 ToolMessage + 可选 state 更新
 */
import { Command, getCurrentTaskInput } from "@langchain/langgraph";
import { ToolMessage } from "@langchain/core/messages";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";

import type { AgentStateType } from "../state.js";
import type { WorkProfile } from "../schemas.js";
import { defaultProfile } from "../schemas.js";
import { parseProfile } from "../state.js";

export function getState(): AgentStateType {
  return getCurrentTaskInput() as AgentStateType;
}

export function updateProfile(
  state: AgentStateType,
  updates: Partial<WorkProfile>,
): WorkProfile {
  return { ...parseProfile(state), ...updates };
}

export function toolCommand(
  config: LangGraphRunnableConfig,
  content: string,
  updates: Record<string, unknown> = {},
): Command {
  const toolCallId = config.toolCall?.id ?? "";
  return new Command({
    update: {
      messages: [new ToolMessage({ content, tool_call_id: toolCallId })],
      ...updates,
    },
  });
}

export function mergeProfileReferences(
  profile: WorkProfile,
  refs: WorkProfile["references"],
): WorkProfile {
  return {
    ...profile,
    references: [...(profile.references ?? []), ...(refs ?? [])],
  };
}

export { defaultProfile };
