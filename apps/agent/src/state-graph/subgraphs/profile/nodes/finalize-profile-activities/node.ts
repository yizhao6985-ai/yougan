/** 工具执行后收束 profile_update activity（避免停留在「正在更新」） */
import type { RunnableConfig } from "@langchain/core/runnables";

import { finalizeRunningProfileActivities } from "#agent/state-io/finalize-profile-activities.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

export async function finalizeProfileActivitiesNode(
  state: AgentStateType,
  _config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const messages = finalizeRunningProfileActivities(state.messages);
  if (!messages.length) return {};
  return { messages };
}
