/** 按用户意图修改作品方案：bind 原子工具并流式决策 */
import { SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { env } from "#agent/env.js";
import { streamChat } from "#agent/llm/invoke/index.js";
import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import { getLatestHumanMessageText } from "#agent/messages/human.js";
import { prepareChatMessagesForLlm } from "#agent/messages/llm-input.js";
import type { AgentStateType } from "#agent/state.js";

import { buildMutateProfilePrompt } from "./prompt.js";
import { PROFILE_TOOLS } from "../run-profile-tools/tools/index.js";

const llmWithTools = createChatModel({
  temperature: env.llmTemperature,
}).bindTools(PROFILE_TOOLS);

export async function mutateProfileNode(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<Partial<AgentStateType>> {
  const userMessage = getLatestHumanMessageText(state.messages).trim();
  if (!userMessage) return {};

  const response = await streamChat(
    llmWithTools,
    [
      new SystemMessage(buildMutateProfilePrompt(state)),
      ...prepareChatMessagesForLlm(state),
    ],
    config,
  );
  return { messages: [response], ...patchAiUsageMetering(state.aiUsage, config) };
}
