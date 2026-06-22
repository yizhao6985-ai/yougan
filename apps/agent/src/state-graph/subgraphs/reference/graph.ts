import { END, START, StateGraph } from "@langchain/langgraph";
import { toolsCondition } from "@langchain/langgraph/prebuilt";

import { AgentState } from "#agent/state.js";

import * as afterMutateReferences from "./conditional-edges/after-mutate-references.js";
import * as afterPreprocessReferences from "./conditional-edges/after-preprocess-references.js";
import { enterReferenceNode } from "./nodes/enter-reference/node.js";
import { finalizeReferencesNode } from "./nodes/finalize-references/node.js";
import { mutateReferencesNode } from "./nodes/mutate-references/node.js";
import { preprocessReferencesNode } from "./nodes/preprocess-references/node.js";
import { runMutateToolsNode } from "./nodes/run-mutate-tools/node.js";
import { runPreprocessToolsNode } from "./nodes/run-preprocess-tools/node.js";

export const referenceGraph = new StateGraph(AgentState)
  .addNode("enterReference", enterReferenceNode)
  .addNode("preprocessReferences", preprocessReferencesNode)
  .addNode("runPreprocessTools", runPreprocessToolsNode)
  .addNode("mutateReferences", mutateReferencesNode)
  .addNode("runMutateTools", runMutateToolsNode)
  .addNode("finalizeReferences", finalizeReferencesNode)
  .addEdge(START, "enterReference")
  .addEdge("enterReference", "preprocessReferences")
  .addConditionalEdges(
    afterPreprocessReferences.from,
    afterPreprocessReferences.selectAfterPreprocessReferences,
    afterPreprocessReferences.paths,
  )
  .addEdge("runPreprocessTools", "preprocessReferences")
  .addConditionalEdges(
    afterMutateReferences.from,
    toolsCondition,
    afterMutateReferences.paths,
  )
  .addEdge("runMutateTools", "mutateReferences")
  .addEdge("finalizeReferences", END)
  .compile();
