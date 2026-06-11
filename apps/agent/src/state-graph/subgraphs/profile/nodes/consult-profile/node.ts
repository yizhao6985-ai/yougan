/** 作品方案对话：bind profile 工具并流式回复 */
import { SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { env } from "#agent/env.js";
import { streamChat } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import { prepareChatMessagesForLlm } from "#agent/messages/llm-input.js";
import type { AgentStateType } from "#agent/state.js";

import { buildConsultProfilePrompt } from "./prompt.js";
import { PROFILE_TOOLS } from "../run-profile-tools/tools/index.js";

const llmWithTools = createChatModel({
  temperature: env.llmTemperature,
}).bindTools(PROFILE_TOOLS);

export async function consultProfileNode(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<Partial<AgentStateType>> {
  const response = await streamChat(
    llmWithTools,
    [
      new SystemMessage(buildConsultProfilePrompt(state)),
      ...prepareChatMessagesForLlm(state),
    ],
    config,
  );
  return { messages: [response] };
}
