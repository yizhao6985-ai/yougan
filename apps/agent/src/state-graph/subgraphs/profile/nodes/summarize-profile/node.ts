/** summarize-profile：总结方案变更并流式回复感友 */
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { WorkProfile } from "@yougan/domain";

import { streamChat } from "#agent/llm/invoke/index.js";
import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import { getLatestHumanMessageText } from "#agent/messages/human.js";
import { getPreview, getProduction, getProfile } from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { buildSummarizeProfilePrompt } from "./prompt.js";

function profileSnapshotChanged(
  before: WorkProfile,
  after: WorkProfile,
): boolean {
  return JSON.stringify(before) !== JSON.stringify(after);
}

export async function summarizeProfileNode(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<AgentStatePatch> {
  const before = state.profile;
  const after = getProfile(state);
  const userMessage = getLatestHumanMessageText(state.messages).trim();
  const changed = profileSnapshotChanged(before, after);

  if (!changed && !userMessage) {
    return {
      messages: [new AIMessage("作品方案暂无变更。")],
      ...patchAiUsageMetering(state.aiUsage, config),
    };
  }

  const llm = createChatModel({ temperature: 0.2 });
  const response = await streamChat(
    llm,
    [
      new HumanMessage(
        buildSummarizeProfilePrompt({
          before,
          after,
          user_message: userMessage,
          changed,
          preview: getPreview(state),
          production: getProduction(state),
        }),
      ),
    ],
    config,
  );

  return {
    messages: [response],
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}
