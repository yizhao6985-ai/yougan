/** llm-chat：作品方案对话 LLM */
import { SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { env } from "#agent/env.js";
import { streamChat } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import type { AgentStateType } from "#agent/state.js";

import { buildProfilePrompt } from "./prompt.js";
import { PROFILE_TOOLS } from "../tool-node/tools/index.js";

const llmWithTools = createChatModel({
  temperature: env.llmTemperature,
}).bindTools(PROFILE_TOOLS);

export async function llmCall(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<Partial<AgentStateType>> {
  const response = await streamChat(
    llmWithTools,
    [new SystemMessage(buildProfilePrompt(state)), ...(state.messages ?? [])],
    config,
  );
  return { messages: [response] };
}
