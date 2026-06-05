/**
 * 制作模式子图：ensureProfile → resolveContentSpec → scheduleProduction
 * → llmCall/designLlmCall ⇄ tools → inspectProduction
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { AgentState } from "#agent/state.js";
import * as afterLlm from "./conditional-edges/after-llm.js";
import * as routeAfterInspect from "./conditional-edges/route-after-inspect.js";
import * as routeAfterTools from "./conditional-edges/route-after-tools.js";
import * as routeByModality from "./conditional-edges/route-by-modality.js";
import { designLlmCall, llmCall } from "./creator/llm-nodes.js";
import { toolNode } from "./creator/tools/index.js";
import { inspectProductionNode } from "./inspector/inspect-task/index.js";
import { ensureProfileNode } from "./planner/ensure-profile/index.js";
import { resolveContentSpecNode } from "./planner/resolve-content-spec/index.js";
import { scheduleProductionNode } from "./planner/schedule-production/index.js";

const productionWorkflow = new StateGraph(AgentState)
  .addNode("ensureProfile", ensureProfileNode)
  .addNode("resolveContentSpec", resolveContentSpecNode)
  .addNode("scheduleProduction", scheduleProductionNode)
  .addNode("llmCall", llmCall)
  .addNode("designLlmCall", designLlmCall)
  .addNode("tools", toolNode)
  .addNode("inspectProduction", inspectProductionNode)
  .addEdge(START, "ensureProfile")
  .addEdge("ensureProfile", "resolveContentSpec")
  .addEdge("resolveContentSpec", "scheduleProduction")
  .addConditionalEdges(
    routeByModality.from,
    routeByModality.routeByModality,
    routeByModality.paths,
  )
  .addConditionalEdges(
    afterLlm.fromLlm,
    afterLlm.shouldContinueFromLlm,
    afterLlm.paths,
  )
  .addConditionalEdges(
    afterLlm.fromDesign,
    afterLlm.shouldContinueFromDesign,
    afterLlm.paths,
  )
  .addConditionalEdges(
    routeAfterTools.from,
    routeAfterTools.routeAfterTools,
    routeAfterTools.paths,
  )
  .addConditionalEdges(
    routeAfterInspect.from,
    routeAfterInspect.routeAfterInspect,
    routeAfterInspect.paths,
  );

export const productionGraph = productionWorkflow.compile();
