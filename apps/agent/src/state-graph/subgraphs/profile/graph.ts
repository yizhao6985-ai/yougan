import { START, StateGraph } from "@langchain/langgraph";
import { toolsCondition } from "@langchain/langgraph/prebuilt";

import { AgentState } from "#agent/state.js";

import * as dispatchReferenceParse from "./conditional-edges/dispatch-reference-parse.js";
import * as llmToolCalls from "./conditional-edges/llm-tool-calls.js";
import { llmCall } from "./nodes/llm-call/node.js";
import { parseReferenceImageNode } from "./nodes/parse-reference-image/node.js";
import { parseReferenceTextNode } from "./nodes/parse-reference-text/node.js";
import { toolNode } from "./nodes/tool-node/node.js";

export const profileGraph = new StateGraph(AgentState)
  .addNode("llm-call", llmCall)
  .addNode("tool-node", toolNode)
  .addNode("parseReferenceText", parseReferenceTextNode)
  .addNode("parseReferenceImage", parseReferenceImageNode)
  .addEdge(START, "llm-call")
  .addConditionalEdges(llmToolCalls.from, toolsCondition, llmToolCalls.paths)
  .addConditionalEdges(
    dispatchReferenceParse.from,
    dispatchReferenceParse.dispatchReferenceParse,
    dispatchReferenceParse.paths,
  )
  .addEdge("parseReferenceText", "llm-call")
  .addEdge("parseReferenceImage", "llm-call")
  .compile();
