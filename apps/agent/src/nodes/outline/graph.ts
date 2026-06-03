/**
 * 大纲模式子图：prepare → llmCall ⇄ tools（brief 定稿后调整内容结构）。
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import * as afterLlm from "./conditional-edges/after-llm.js";
import { llmCall } from "./nodes/llm-call/index.js";
import { prepareOutlineTurnNode } from "./nodes/prepare-turn/index.js";
import { toolNode } from "./nodes/tools/index.js";
import { AgentState } from "#agent/state.js";

const outlineWorkflow = new StateGraph(AgentState)
  .addNode("prepare", prepareOutlineTurnNode)
  .addNode("llmCall", llmCall)
  .addNode("tools", toolNode)
  .addEdge(START, "prepare")
  .addEdge("prepare", "llmCall")
  .addConditionalEdges(afterLlm.from, afterLlm.shouldContinue, afterLlm.paths)
  .addEdge("tools", "llmCall");

export const outlineGraph = outlineWorkflow.compile();
