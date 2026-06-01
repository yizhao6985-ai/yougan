/**
 * 提问模式 LLM 调用节点。
 */
import { SystemMessage } from "@langchain/core/messages";
import type { GraphNode } from "@langchain/langgraph";

import { env } from "../../../env.js";
import { createChatModel } from "../../../llm/dashscope.js";
import { AgentState } from "../../../state.js";
import { ASK_TOOLS } from "./tools.js";
import { buildAskLlmPrompt } from "./llm-call.prompt.js";

const llmWithTools = createChatModel({ temperature: env.llmTemperature }).bindTools(
  ASK_TOOLS,
);

export const llmCall: GraphNode<typeof AgentState> = async (state) => {
  const response = await llmWithTools.invoke([
    new SystemMessage(buildAskLlmPrompt(state)),
    ...(state.messages ?? []),
  ]);
  return { messages: [response] };
};
