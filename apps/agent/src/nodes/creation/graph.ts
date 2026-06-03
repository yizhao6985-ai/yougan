/**
 * 创作模式子图：prepare → resolveContentSpec → creativeDirector → llmCall ⇄ tools。
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import * as afterLlm from "./conditional-edges/after-llm.js";
import * as routeByModality from "./conditional-edges/route-by-modality.js";
import { creativeDirectorNode } from "./nodes/creative-director/index.js";
import { llmCall } from "./nodes/llm-call/index.js";
import { prepareCreationTurnNode } from "./nodes/prepare-turn/index.js";
import { resolveContentSpecNode } from "./nodes/resolve-content-spec/index.js";
import { toolNode } from "./nodes/tools/index.js";
import { AgentState } from "#agent/state.js";

const creationWorkflow = new StateGraph(AgentState)
  .addNode("prepare", prepareCreationTurnNode)
  .addNode("resolveContentSpec", resolveContentSpecNode)
  .addNode("creativeDirector", creativeDirectorNode)
  .addNode("llmCall", llmCall)
  .addNode("tools", toolNode)
  .addEdge(START, "prepare")
  .addEdge("prepare", "resolveContentSpec")
  .addEdge("resolveContentSpec", "creativeDirector")
  .addConditionalEdges(
    routeByModality.from,
    routeByModality.routeByModality,
    routeByModality.paths,
  )
  .addConditionalEdges(afterLlm.from, afterLlm.shouldContinue, afterLlm.paths)
  .addEdge("tools", "llmCall");

export const creationGraph = creationWorkflow.compile();
