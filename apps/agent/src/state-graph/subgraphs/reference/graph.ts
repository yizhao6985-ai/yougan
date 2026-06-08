import { START, StateGraph } from "@langchain/langgraph";
import { toolsCondition } from "@langchain/langgraph/prebuilt";

import { AgentState } from "#agent/state.js";

import * as llmToolCalls from "./conditional-edges/llm-tool-calls.js";
import { referenceTurnNode } from "./nodes/reference-turn/node.js";
import { toolNode } from "./nodes/tool-node/node.js";

export const referenceGraph = new StateGraph(AgentState)
  .addNode("reference-turn", referenceTurnNode)
  .addNode("tool-node", toolNode)
  .addEdge(START, "reference-turn")
  .addConditionalEdges(llmToolCalls.from, toolsCondition, llmToolCalls.paths)
  .addEdge("tool-node", "reference-turn")
  .compile();
