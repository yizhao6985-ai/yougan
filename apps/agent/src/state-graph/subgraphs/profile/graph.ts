import { START, StateGraph } from "@langchain/langgraph";
import { toolsCondition } from "@langchain/langgraph/prebuilt";

import { AgentState } from "#agent/state.js";

import * as llmToolCalls from "./conditional-edges/llm-tool-calls.js";
import { llmCall } from "./nodes/llm-call/node.js";
import { toolNode } from "./nodes/tool-node/node.js";

export const profileGraph = new StateGraph(AgentState)
  .addNode("llmCall", llmCall)
  .addNode("toolNode", toolNode)
  .addEdge(START, "llmCall")
  .addConditionalEdges(llmToolCalls.from, toolsCondition, llmToolCalls.paths)
  .addEdge("toolNode", "llmCall")
  .compile();
