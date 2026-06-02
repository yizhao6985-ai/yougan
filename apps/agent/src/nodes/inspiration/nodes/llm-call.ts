/**
 * 灵感模式 LLM 调用节点：绑定 tools，产出 AIMessage（可含 tool_calls）。
 */
import { SystemMessage } from "@langchain/core/messages";
import type { GraphNode } from "@langchain/langgraph";

import { streamChatModelToAIMessage } from "../../../lib/stream-chat-model.js";
import { env } from "../../../env.js";
import { createChatModel } from "../../../llm/dashscope.js";
import { AgentState } from "../../../state.js";
import { INSPIRATION_TOOLS } from "./tools.js";
import { buildInspirationLlmPrompt } from "./llm-call.prompt.js";

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
