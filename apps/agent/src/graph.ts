/**
 * Yougan 主 Graph 入口（langgraph.json 指向此文件）。
 *
 * 每次用户发消息时，根据 state.mode 路由到对应子图：
 *
 *   START
 *     ├─ inspiration → inspirationAgent → END
 *     ├─ outline     → outlineAgent → clearInspirationChoices → END
 *     └─ creation    → creationAgent → clearInspirationChoices → END
 *
 * mode 由前端 submit 或 switch_mode 工具写入；路由只在 START 发生一次，
 * 单次 run 内不会跨模式跳转子图（切换 mode 后下一条消息才进入新子图）。
 */
import { END, START, StateGraph } from "@langchain/langgraph";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";

import { getCreationAgent } from "./llm/agent-factory.js";
import { inspirationGraph } from "./agents/inspiration/graph.js";
import { outlineGraph } from "./agents/outline/graph.js";
import {
  AgentState,
  parseModelTemperature,
  parseMode,
  type AgentStateType,
} from "./state.js";

/** 大纲/创作回合结束后清空结构化选项；inspirationChoices 不入库，仅当轮有效。 */
async function clearInspirationChoices(
  _state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  return { inspirationChoices: null };
}

/** 读取 state.mode，决定本次 run 进入哪个模式子图。 */
function routeByMode(
  state: AgentStateType,
): "inspiration" | "outline" | "creation" {
  return parseMode(state);
}

async function runCreationAgent(
  state: AgentStateType,
  config?: LangGraphRunnableConfig,
) {
  const agent = getCreationAgent(parseModelTemperature(state));
  return agent.invoke(state, config);
}

const workflow = new StateGraph(AgentState)
  .addNode("inspirationAgent", inspirationGraph)
  .addNode("outlineAgent", outlineGraph)
  .addNode("creationAgent", runCreationAgent)
  .addNode("clearInspirationChoices", clearInspirationChoices)
  .addConditionalEdges(START, routeByMode, {
    inspiration: "inspirationAgent",
    outline: "outlineAgent",
    creation: "creationAgent",
  })
  .addEdge("inspirationAgent", END)
  .addEdge("outlineAgent", "clearInspirationChoices")
  .addEdge("creationAgent", "clearInspirationChoices")
  .addEdge("clearInspirationChoices", END);

export const graph = workflow.compile();
