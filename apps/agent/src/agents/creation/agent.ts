/** 创作模式 ReAct Agent（MiniMax）：按大纲生成文案并 complete_execution */
import { SystemMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import { createChatModel } from "../../llm/minimax.js";
import { AgentState, type AgentStateType } from "./state.js";
import { buildCreationSystemPrompt } from "./prompts.js";
import { CREATION_TOOLS } from "./tools.js";

export function createCreationAgent(temperature: number) {
  return createReactAgent({
    llm: createChatModel({ temperature }),
    tools: CREATION_TOOLS,
    stateSchema: AgentState,
    prompt: (state) => {
      const typed = state as AgentStateType;
      const system = buildCreationSystemPrompt(typed);
      return [new SystemMessage(system), ...(typed.messages ?? [])];
    },
  });
}
