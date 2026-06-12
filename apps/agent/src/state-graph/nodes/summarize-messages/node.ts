/** 回合末：对话 messages 过长则滚动摘要，否则无操作 */
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { resolveConversationSummary } from "./helpers/summarize-conversation.js";

export async function summarizeMessagesNode(
  state: AgentStateType,
  config?: import("@langchain/core/runnables").RunnableConfig,
): Promise<AgentStatePatch> {
  const patch = await resolveConversationSummary(state, config);
  return patch ?? {};
}
