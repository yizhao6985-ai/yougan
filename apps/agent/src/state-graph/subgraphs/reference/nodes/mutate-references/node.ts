/** 按用户意图删改参考：bind 原子工具并流式决策 */
import { SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { env } from "#agent/env.js";
import { streamChat } from "#agent/llm/invoke/index.js";
import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import { getLatestHumanMessageText } from "#agent/messages/human.js";
import { prepareChatMessagesForLlm } from "#agent/messages/llm-input.js";
import type { AgentStateType } from "#agent/state.js";

import { buildMutateReferencesPrompt } from "./prompt.js";
import { MUTATE_REFERENCE_TOOLS } from "../run-mutate-tools/tools/index.js";

const llmWithTools = createChatModel({
  temperature: env.llmTemperature,
}).bindTools(MUTATE_REFERENCE_TOOLS);

export async function mutateReferencesNode(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<Partial<AgentStateType>> {
  const userMessage = getLatestHumanMessageText(state.messages).trim();
  if (!userMessage) return {};

  const response = await streamChat(
    llmWithTools,
    [
      new SystemMessage(buildMutateReferencesPrompt(state)),
      ...prepareChatMessagesForLlm(state),
    ],
    config,
  );
  return { messages: [response], ...patchAiUsageMetering(state.aiUsage, config) };
}
