import { SystemMessage } from "@langchain/core/messages";
import type { GraphNode } from "@langchain/langgraph";

import { streamChatModelToAIMessage } from "#agent/lib/stream-chat-model.js";
import { env } from "#agent/env.js";
import { createChatModel } from "#agent/llm/dashscope.js";
import { AgentState } from "#agent/state.js";
import { BLUEPRINT_TOOLS } from "../tools/index.js";
import { buildBlueprintLlmPrompt } from "./prompt.js";

const llmWithTools = createChatModel({ temperature: env.llmTemperature }).bindTools(
  BLUEPRINT_TOOLS,
);

export const llmCall: GraphNode<typeof AgentState> = async (state, config) => {
  const response = await streamChatModelToAIMessage(
    llmWithTools,
    [
      new SystemMessage(buildBlueprintLlmPrompt(state)),
      ...(state.messages ?? []),
    ],
    config,
  );
  return { messages: [response] };
};
