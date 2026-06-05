import { START, StateGraph } from "@langchain/langgraph";
import { toolsCondition } from "@langchain/langgraph/prebuilt";

import { AgentState } from "#agent/state.js";

import * as dispatchReferenceParse from "./conditional-edges/dispatch-reference-parse.js";
import * as llmToolCalls from "./conditional-edges/llm-tool-calls.js";
import { llmCall } from "./nodes/llmCall/node.js";
import { parseReferenceImageNode } from "./nodes/parseReferenceImage/node.js";
import { parseReferenceTextNode } from "./nodes/parseReferenceText/node.js";
import { runTools } from "./nodes/runTools/node.js";

export const profileGraph = new StateGraph(AgentState)
  .addNode("llmCall", llmCall)
  .addNode("runTools", runTools)
  .addNode("parseReferenceText", parseReferenceTextNode)
  .addNode("parseReferenceImage", parseReferenceImageNode)
  .addEdge(START, "llmCall")
  .addConditionalEdges(llmToolCalls.from, toolsCondition, llmToolCalls.paths)
  .addConditionalEdges(
    dispatchReferenceParse.from,
    dispatchReferenceParse.dispatchReferenceParse,
    dispatchReferenceParse.paths,
  )
  .addEdge("parseReferenceText", "llmCall")
  .addEdge("parseReferenceImage", "llmCall")
  .compile();
