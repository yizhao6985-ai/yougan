import { START, StateGraph } from "@langchain/langgraph";
import { toolsCondition } from "@langchain/langgraph/prebuilt";

import { AgentState } from "#agent/state.js";

import * as llmToolCalls from "./conditional-edges/llm-tool-calls.js";
import { llmCall } from "./nodes/llm-call/node.js";
import { toolNode } from "./nodes/tool-node/node.js";

export const askGraph = new StateGraph(AgentState)
  .addNode("llm-call", llmCall)
  .addNode("tool-node", toolNode)
  .addEdge(START, "llm-call")
  .addConditionalEdges(llmToolCalls.from, toolsCondition, llmToolCalls.paths)
  .addEdge("tool-node", "llm-call")
  .compile();
