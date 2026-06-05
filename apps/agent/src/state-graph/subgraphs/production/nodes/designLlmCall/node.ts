/** llm-chat：设计管线 LLM，共用 llmCall/tools */
import { SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { env } from "#agent/env.js";
import { streamChatModelToAIMessage } from "#agent/llm/stream-chat-model.js";
import { createChatModel } from "#agent/model/dashscope.js";
import type { AgentStateType } from "#agent/state.js";

import { PRODUCTION_TOOLS } from "../llmCall/tools/index.js";
import { buildDesignLlmPrompt } from "./prompt.js";

const llmWithTools = createChatModel({
  temperature: env.llmTemperature,
}).bindTools(PRODUCTION_TOOLS);

export async function designLlmCall(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<Partial<AgentStateType>> {
  const response = await streamChatModelToAIMessage(
    llmWithTools,
    [new SystemMessage(buildDesignLlmPrompt(state)), ...(state.messages ?? [])],
    config,
  );
  return { messages: [response] };
}
