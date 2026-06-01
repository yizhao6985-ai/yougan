/**
 * 提问模式子图：prepare → react。
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { prepareAskTurnNode } from "./nodes/prepare-turn/index.js";
import { askReactNode } from "./nodes/react/index.js";
import { AgentState } from "../../state.js";

const askWorkflow = new StateGraph(AgentState)
  .addNode("prepare", prepareAskTurnNode)
  .addNode("react", askReactNode)
  .addEdge(START, "prepare")
  .addEdge("prepare", "react")
  .addEdge("react", END);

export const askGraph = askWorkflow.compile();
