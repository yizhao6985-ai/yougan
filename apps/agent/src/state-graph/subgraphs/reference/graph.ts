import { START, StateGraph } from "@langchain/langgraph";
import { toolsCondition } from "@langchain/langgraph/prebuilt";

import { AgentState } from "#agent/state.js";

import * as llmToolCalls from "./conditional-edges/llm-tool-calls.js";
import * as routeReferenceEntry from "./conditional-edges/route-reference-entry.js";
import { ingestReferencesNode } from "./nodes/ingest-references/node.js";
import { referenceTurnNode } from "./nodes/reference-turn/node.js";
import { toolNode } from "./nodes/tool-node/node.js";

export const referenceGraph = new StateGraph(AgentState)
  .addNode("ingestReferences", ingestReferencesNode)
  .addNode("referenceTurn", referenceTurnNode)
  .addNode("toolNode", toolNode)
  .addConditionalEdges(
    START,
    routeReferenceEntry.selectReferenceEntry,
    routeReferenceEntry.paths,
  )
  .addEdge("ingestReferences", "referenceTurn")
  .addConditionalEdges(llmToolCalls.from, toolsCondition, llmToolCalls.paths)
  .addEdge("toolNode", "referenceTurn")
  .compile();
