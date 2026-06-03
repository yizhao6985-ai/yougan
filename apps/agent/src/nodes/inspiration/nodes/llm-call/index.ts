/**
 * 灵感模式 LLM 调用节点：绑定 tools，产出 AIMessage（可含 tool_calls）。
 */
import { SystemMessage } from "@langchain/core/messages";
import type { GraphNode } from "@langchain/langgraph";

import { streamChatModelToAIMessage } from "#agent/lib/stream-chat-model.js"
import { env } from "#agent/env.js"
import { createChatModel } from "#agent/llm/dashscope.js"
import { AgentState } from "#agent/state.js"
import { INSPIRATION_TOOLS } from "../tools/index.js";
import { buildInspirationLlmPrompt } from "./prompt.js";

const llmWithTools = createChatModel({ temperature: env.llmTemperature }).bindTools(
  INSPIRATION_TOOLS,
);

export const llmCall: GraphNode<typeof AgentState> = async (state, config) => {
  const response = await streamChatModelToAIMessage(
    llmWithTools,
    [
      new SystemMessage(buildInspirationLlmPrompt(state)),
      ...(state.messages ?? []),
    ],
    config,
  );
  return { messages: [response] };
};
