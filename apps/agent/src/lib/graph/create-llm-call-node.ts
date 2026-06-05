import { SystemMessage } from "@langchain/core/messages";
import type { StructuredToolInterface } from "@langchain/core/tools";
import type { GraphNode } from "@langchain/langgraph";

import { env } from "#agent/env.js";
import { createChatModel } from "#agent/llm/dashscope.js";
import { streamChatModelToAIMessage } from "#agent/lib/stream-chat-model.js";
import { AgentState } from "#agent/state.js";
import type { AgentStateType } from "#agent/state.js";

export type CreateLlmCallNodeOptions = {
  tools: StructuredToolInterface[];
  buildPrompt: (state: AgentStateType) => string;
  temperature?: number;
};

/** 绑定 tools 的流式 LLM 节点：SystemMessage + 历史 messages → AIMessage */
export function createLlmCallNode({
  tools,
  buildPrompt,
  temperature = env.llmTemperature,
}: CreateLlmCallNodeOptions): GraphNode<typeof AgentState> {
  const llmWithTools = createChatModel({ temperature }).bindTools(tools);

  return async (state, config) => {
    const response = await streamChatModelToAIMessage(
      llmWithTools,
      [
        new SystemMessage(buildPrompt(state)),
        ...(state.messages ?? []),
      ],
      config,
    );
    return { messages: [response] };
  };
}
