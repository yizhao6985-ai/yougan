/** 灵感模式 ReAct Agent：MiniMax 工具轮 + 对话回复 */
import { SystemMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import { createChatModel } from "../../llm/minimax.js";
import { AgentState, type AgentStateType } from "../../state.js";
import { buildInspirationActionPrompt } from "./prompts.js";
import { INSPIRATION_TOOLS } from "./tools.js";

export function createInspirationAgent(temperature: number) {
  return createReactAgent({
    llm: createChatModel({ temperature }),
    tools: INSPIRATION_TOOLS,
    stateSchema: AgentState,
    prompt: (state) => {
      const typed = state as AgentStateType;
      const system = buildInspirationActionPrompt(typed);
      return [new SystemMessage(system), ...(typed.messages ?? [])];
    },
  });
}
