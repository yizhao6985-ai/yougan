/** llm-chat：文案管线 LLM，bind PRODUCTION_TOOLS */
import { SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { env } from "#agent/env.js";
import { streamChat } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import type { AgentStateType } from "#agent/state.js";

import { buildProductionLlmPrompt } from "./prompt.js";
import { PRODUCTION_TOOLS } from "../tool-node/tools/index.js";

const llmWithTools = createChatModel({
  temperature: env.llmTemperature,
}).bindTools(PRODUCTION_TOOLS);

export async function llmCall(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<Partial<AgentStateType>> {
  const response = await streamChat(
    llmWithTools,
    [
      new SystemMessage(buildProductionLlmPrompt(state)),
      ...(state.messages ?? []),
    ],
    config,
  );
  return { messages: [response] };
}
