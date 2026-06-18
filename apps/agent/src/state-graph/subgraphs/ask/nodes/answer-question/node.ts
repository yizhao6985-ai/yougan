/** 提问答疑：bind ask 工具并流式回复 */
import { SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { env } from "#agent/env.js";
import { streamChat } from "#agent/llm/invoke/index.js";
import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import { prepareChatMessagesForLlm } from "#agent/messages/llm-input.js";
import type { AgentStateType } from "#agent/state.js";

import { ASK_TOOLS } from "../run-ask-tools/tools/index.js";
import { buildAnswerQuestionPrompt } from "./prompt.js";

const llmWithTools = createChatModel({
  temperature: env.llmTemperature,
}).bindTools(ASK_TOOLS);

export async function answerQuestionNode(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<Partial<AgentStateType>> {
  const response = await streamChat(
    llmWithTools,
    [new SystemMessage(buildAnswerQuestionPrompt(state)), ...prepareChatMessagesForLlm(state)],
    config,
  );
  return { messages: [response], ...patchAiUsageMetering(state.aiUsage, config) };
}
