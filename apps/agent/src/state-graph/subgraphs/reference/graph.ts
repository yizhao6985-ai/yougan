import { START, StateGraph } from "@langchain/langgraph";
import { toolsCondition } from "@langchain/langgraph/prebuilt";

import { AgentState } from "#agent/state.js";

import * as llmToolCalls from "./conditional-edges/llm-tool-calls.js";
import { analyzeReferenceNode } from "./nodes/analyze-reference/node.js";
import { referenceTurnNode } from "./nodes/reference-turn/node.js";
import { toolNode } from "./nodes/tool-node/node.js";

export const referenceGraph = new StateGraph(AgentState)
  .addNode("analyze-reference", analyzeReferenceNode)
  .addNode("reference-turn", referenceTurnNode)
  .addNode("tool-node", toolNode)
  .addEdge(START, "analyze-reference")
  .addEdge("analyze-reference", "reference-turn")
  .addConditionalEdges(llmToolCalls.from, toolsCondition, llmToolCalls.paths)
  .addEdge("tool-node", "reference-turn")
  .compile();
