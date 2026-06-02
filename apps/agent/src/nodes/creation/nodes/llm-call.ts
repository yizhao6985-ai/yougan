/**
 * 创作模式 LLM 调用节点（出稿协调）。
 */
import { SystemMessage } from "@langchain/core/messages";
import type { GraphNode } from "@langchain/langgraph";

import { streamChatModelToAIMessage } from "../../../lib/stream-chat-model.js";
import { env } from "../../../env.js";
import { createChatModel } from "../../../llm/dashscope.js";
import { AgentState } from "../../../state.js";
import { CREATION_TOOLS } from "./tools.js";
import { buildCreationLlmPrompt } from "./llm-call.prompt.js";

const llmWithTools = createChatModel({ temperature: env.llmTemperature }).bindTools(
  CREATION_TOOLS,
);

export const llmCall: GraphNode<typeof AgentState> = async (state, config) => {
  const response = await streamChatModelToAIMessage(
    llmWithTools,
    [
      new SystemMessage(buildCreationLlmPrompt(state)),
      ...(state.messages ?? []),
    ],
    config,
  );
  return { messages: [response] };
};
