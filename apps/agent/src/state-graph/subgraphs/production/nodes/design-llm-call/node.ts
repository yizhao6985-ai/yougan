/** llm-chat：设计管线 LLM，共用 tool-node/tools */
import { SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { env } from "#agent/env.js";
import { streamChat } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import { prepareChatMessagesForLlm } from "#agent/messages/llm-input.js";
import type { AgentStateType } from "#agent/state.js";

import { PRODUCTION_TOOLS } from "../tool-node/tools/index.js";
import { buildDesignLlmPrompt } from "./prompt.js";

const llmWithTools = createChatModel({
  temperature: env.llmTemperature,
}).bindTools(PRODUCTION_TOOLS);

export async function designLlmCall(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<Partial<AgentStateType>> {
  const response = await streamChat(
    llmWithTools,
    [
      new SystemMessage(buildDesignLlmPrompt(state)),
      ...prepareChatMessagesForLlm(state),
    ],
    config,
  );
  return { messages: [response] };
}
