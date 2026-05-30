/**
 * 灵感模式子图：ReAct Agent（工具 + 对话）。
 *
 *   START → prepare（清空当轮选项）
 *        → agent
 *        → END
 */
import { END, START, StateGraph } from "@langchain/langgraph";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";

import { getInspirationAgent } from "../../llm/agent-factory.js";
import { parseModelTemperature } from "../../lib/parse-agent-state.js";
import { syncReferenceImagesFromLatestMessage } from "../../lib/sync-reference-images.js";
import { AgentState, type AgentStateType } from "../../state.js";

async function prepareInspirationTurn(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const refPatch = await syncReferenceImagesFromLatestMessage(state);
  return { inspirationChoices: null, ...refPatch };
}

async function runInspirationAgent(
  state: AgentStateType,
  config?: LangGraphRunnableConfig,
) {
  const agent = getInspirationAgent(parseModelTemperature(state));
  return agent.invoke(state, config);
}

const inspirationWorkflow = new StateGraph(AgentState)
  .addNode("prepare", prepareInspirationTurn)
  .addNode("agent", runInspirationAgent)
  .addEdge(START, "prepare")
  .addEdge("prepare", "agent")
  .addEdge("agent", END);

export const inspirationGraph = inspirationWorkflow.compile();
