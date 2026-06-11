/** 设计管线：创意总监对话，bind production 工具 */
import { SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { env } from "#agent/env.js";
import { streamChat } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import { prepareChatMessagesForLlm } from "#agent/messages/llm-input.js";
import type { AgentStateType } from "#agent/state.js";

import { PRODUCTION_TOOLS } from "../run-production-tools/tools/index.js";
import { buildDirectDesignPrompt } from "./prompt.js";

const llmWithTools = createChatModel({
  temperature: env.llmTemperature,
}).bindTools(PRODUCTION_TOOLS);

export async function directDesignNode(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<Partial<AgentStateType>> {
  const response = await streamChat(
    llmWithTools,
    [
      new SystemMessage(buildDirectDesignPrompt(state)),
      ...prepareChatMessagesForLlm(state),
    ],
    config,
  );
  return { messages: [response] };
}
