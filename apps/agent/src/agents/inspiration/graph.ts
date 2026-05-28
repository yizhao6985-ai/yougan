/**
 * 灵感模式子图：createReactAgent（tools + responseFormat）→ 映射结构化结果。
 *
 *   START → agent（MiniMax 工具轮 → responseFormat 结构化轮）
 *        → apply_output（structuredResponse → message + inspirationChoices）
 *        → END
 */
import { END, START, StateGraph } from "@langchain/langgraph";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";

import { getInspirationAgent } from "../../llm/agent-factory.js";
import { AgentState, parseModelTemperature, type AgentStateType } from "./state.js";
import { applyInspirationStructuredOutput } from "./turn.js";

function applyInspirationOutput(
  state: AgentStateType,
): Partial<AgentStateType> {
  return applyInspirationStructuredOutput(state);
}

async function runInspirationAgent(
  state: AgentStateType,
  config?: LangGraphRunnableConfig,
) {
  const agent = getInspirationAgent(parseModelTemperature(state));
  return agent.invoke(state, config);
}

const inspirationWorkflow = new StateGraph(AgentState)
  .addNode("agent", runInspirationAgent)
  .addNode("apply_output", applyInspirationOutput)
  .addEdge(START, "agent")
  .addEdge("agent", "apply_output")
  .addEdge("apply_output", END);

export const inspirationGraph = inspirationWorkflow.compile();
