/**
 * 灵感模式子图：prepare → llmCall ⇄ tools（建议由主图 updateNextStepSuggestions 生成）。
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import * as afterLlm from "./conditional-edges/after-llm.js";
import { llmCall } from "./nodes/llm-call/index.js";
import { prepareInspirationTurnNode } from "./nodes/prepare-turn/index.js";
import { toolNode } from "./nodes/tools/index.js";
import { AgentState } from "#agent/state.js";

const inspirationWorkflow = new StateGraph(AgentState)
  .addNode("prepare", prepareInspirationTurnNode)
  .addNode("llmCall", llmCall)
  .addNode("tools", toolNode)
  .addEdge(START, "prepare")
  .addEdge("prepare", "llmCall")
  .addConditionalEdges(afterLlm.from, afterLlm.shouldContinue, afterLlm.paths)
  .addEdge("tools", "llmCall");

export const inspirationGraph = inspirationWorkflow.compile();
