/** 大纲模式 ReAct Agent（MiniMax）：撰写条目、定稿、同步灵感、更新 profile */
import { SystemMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import { createChatModel } from "../../llm/minimax.js";
import { AgentState, type AgentStateType } from "./state.js";
import { buildOutlineSystemPrompt } from "./prompts.js";
import { OUTLINE_TOOLS } from "./tools.js";

export function createOutlineAgent(temperature: number) {
  return createReactAgent({
    llm: createChatModel({ temperature }),
    tools: OUTLINE_TOOLS,
    stateSchema: AgentState,
    prompt: (state) => {
      const typed = state as AgentStateType;
      const system = buildOutlineSystemPrompt(typed);
      return [new SystemMessage(system), ...(typed.messages ?? [])];
    },
  });
}
