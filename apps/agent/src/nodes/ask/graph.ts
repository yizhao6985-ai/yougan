/**
 * 提问模式子图：prepare → llmCall ⇄ tools。
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import * as afterLlm from "./conditional-edges/after-llm.js";
import { llmCall } from "./nodes/llm-call/index.js";
import { prepareAskTurnNode } from "./nodes/prepare-turn/index.js";
import { toolNode } from "./nodes/tools/index.js";
import { AgentState } from "#agent/state.js";

const askWorkflow = new StateGraph(AgentState)
  .addNode("prepare", prepareAskTurnNode)
  .addNode("llmCall", llmCall)
  .addNode("tools", toolNode)
  .addEdge(START, "prepare")
  .addEdge("prepare", "llmCall")
  .addConditionalEdges(afterLlm.from, afterLlm.shouldContinue, afterLlm.paths)
  .addEdge("tools", "llmCall");

export const askGraph = askWorkflow.compile();
