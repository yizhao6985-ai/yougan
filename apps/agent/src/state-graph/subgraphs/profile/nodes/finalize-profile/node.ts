/** finalize-profile：方案变更确认与侧栏引导（模板，无 LLM） */
import { AIMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { getLatestHumanMessageText } from "#agent/messages/human.js";
import { getPreview, getProduction, getProfile } from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { buildProfileFinalizeMessage } from "./helpers/finalize-outcome.js";

export async function finalizeProfileNode(
  state: AgentStateType,
  _config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const before = state.profile;
  const after = getProfile(state);
  const userMessage = getLatestHumanMessageText(state.messages).trim();
  const changed =
    JSON.stringify(before) !== JSON.stringify(after);

  if (!changed && !userMessage) {
    return { messages: [new AIMessage("作品方案暂无变更。")] };
  }

  const content = buildProfileFinalizeMessage({
    before,
    after,
    preview: getPreview(state),
    production: getProduction(state),
  });

  return { messages: [new AIMessage(content)] };
}
