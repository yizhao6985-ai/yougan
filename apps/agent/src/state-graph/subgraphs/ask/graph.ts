import { START, StateGraph } from "@langchain/langgraph";
import { toolsCondition } from "@langchain/langgraph/prebuilt";

import { AgentState } from "#agent/state.js";

import * as llmToolCalls from "./conditional-edges/llm-tool-calls.js";
import { llmCall } from "./nodes/llmCall/node.js";
import { runTools } from "./nodes/runTools/node.js";

export const askGraph = new StateGraph(AgentState)
  .addNode("llmCall", llmCall)
  .addNode("runTools", runTools)
  .addEdge(START, "llmCall")
  .addConditionalEdges(
    llmToolCalls.from,
    toolsCondition,
    llmToolCalls.paths,
  )
  .addEdge("runTools", "llmCall")
  .compile();
