/** llm-chat：提问答疑 LLM */
import { SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { env } from "#agent/env.js";
import { streamChatModelToAIMessage } from "#agent/llm/stream-chat-model.js";
import { createChatModel } from "#agent/model/dashscope.js";
import type { AgentStateType } from "#agent/state.js";

import { buildAskPrompt } from "./prompt.js";
import { ASK_TOOLS } from "./tools/index.js";

const llmWithTools = createChatModel({
  temperature: env.llmTemperature,
}).bindTools(ASK_TOOLS);

export async function llmCall(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<Partial<AgentStateType>> {
  const response = await streamChatModelToAIMessage(
    llmWithTools,
    [new SystemMessage(buildAskPrompt(state)), ...(state.messages ?? [])],
    config,
  );
  return { messages: [response] };
}
