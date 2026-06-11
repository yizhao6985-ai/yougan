import { END, START, StateGraph } from "@langchain/langgraph";

import { AgentState } from "#agent/state.js";

import * as atReferenceEntry from "./conditional-edges/at-reference-entry.js";
import { analyzeNewAssetsNode } from "./nodes/analyze-new-assets/node.js";
import { mutateReferencesNode } from "./nodes/mutate-references/node.js";
import { summarizeReferencesNode } from "./nodes/summarize-references/node.js";

export const referenceGraph = new StateGraph(AgentState)
  .addNode("analyzeNewAssets", analyzeNewAssetsNode)
  .addNode("mutateReferences", mutateReferencesNode)
  .addNode("summarizeReferences", summarizeReferencesNode)
  .addConditionalEdges(
    START,
    atReferenceEntry.selectAtReferenceEntry,
    atReferenceEntry.paths,
  )
  .addEdge("analyzeNewAssets", "mutateReferences")
  .addEdge("mutateReferences", "summarizeReferences")
  .addEdge("summarizeReferences", END)
  .compile();
