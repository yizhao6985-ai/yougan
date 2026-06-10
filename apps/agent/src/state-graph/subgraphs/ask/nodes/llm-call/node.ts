/** llm-chat：提问答疑 LLM */
import { SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { env } from "#agent/env.js";
import { streamChat } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import { prepareChatMessagesForLlm } from "#agent/messages/llm-input.js";
import type { AgentStateType } from "#agent/state.js";

import { ASK_TOOLS } from "../tool-node/tools/index.js";
import { buildAskPrompt } from "./prompt.js";

const llmWithTools = createChatModel({
  temperature: env.llmTemperature,
}).bindTools(ASK_TOOLS);

export async function llmCall(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<Partial<AgentStateType>> {
  const response = await streamChat(
    llmWithTools,
    [new SystemMessage(buildAskPrompt(state)), ...prepareChatMessagesForLlm(state)],
    config,
  );
  return { messages: [response] };
}
