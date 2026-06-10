import { START, StateGraph } from "@langchain/langgraph";

import { AgentState } from "#agent/state.js";

import * as creatorPipelineByModality from "./conditional-edges/creator-pipeline-by-modality.js";
import * as dispatchPendingWork from "./conditional-edges/dispatch-pending-work.js";
import * as llmToolCalls from "./conditional-edges/llm-tool-calls.js";
import * as retryDeliverableOrEnd from "./conditional-edges/retry-deliverable-or-end.js";
import { designLlmCall } from "./nodes/design-llm-call/node.js";
import { ensureProfileNode } from "./nodes/ensure-profile/node.js";
import { generateDraftNode } from "./nodes/generate-draft/node.js";
import { inspectProductionNode } from "./nodes/inspect-production/node.js";
import { llmCall } from "./nodes/llm-call/node.js";
import { resolveContentSpecNode } from "./nodes/resolve-content-spec/node.js";
import { scheduleProductionNode } from "./nodes/schedule-production/node.js";
import { spawnSpecialistNode } from "./nodes/spawn-specialist/node.js";
import { toolNode } from "./nodes/tool-node/node.js";

export const productionGraph = new StateGraph(AgentState)
  .addNode("ensureProfile", ensureProfileNode)
  .addNode("resolveContentSpec", resolveContentSpecNode)
  .addNode("scheduleProduction", scheduleProductionNode)
  .addNode("llmCall", llmCall)
  .addNode("designLlmCall", designLlmCall)
  .addNode("toolNode", toolNode)
  .addNode("generateDraft", generateDraftNode)
  .addNode("spawnSpecialist", spawnSpecialistNode)
  .addNode("inspectProduction", inspectProductionNode)
  .addEdge(START, "ensureProfile")
  .addEdge("ensureProfile", "resolveContentSpec")
  .addEdge("resolveContentSpec", "scheduleProduction")
  .addConditionalEdges(
    creatorPipelineByModality.from,
    creatorPipelineByModality.selectCreatorPipelineByModality,
    creatorPipelineByModality.paths,
  )
  .addConditionalEdges(
    llmToolCalls.fromLlm,
    llmToolCalls.routeLlmCall,
    llmToolCalls.llmPaths,
  )
  .addConditionalEdges(
    llmToolCalls.fromDesign,
    llmToolCalls.routeDesignLlmCall,
    llmToolCalls.designPaths,
  )
  .addConditionalEdges(
    dispatchPendingWork.from,
    dispatchPendingWork.dispatchPendingProductionWork,
    dispatchPendingWork.paths,
  )
  .addEdge("generateDraft", "inspectProduction")
  .addEdge("spawnSpecialist", "inspectProduction")
  .addConditionalEdges(
    retryDeliverableOrEnd.from,
    retryDeliverableOrEnd.retryDeliverableOrEnd,
    retryDeliverableOrEnd.paths,
  )
  .compile();
