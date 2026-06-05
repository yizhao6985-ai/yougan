import { START, StateGraph } from "@langchain/langgraph";
import { toolsCondition } from "@langchain/langgraph/prebuilt";

import { AgentState } from "#agent/state.js";

import * as creatorPipelineByModality from "./conditional-edges/creator-pipeline-by-modality.js";
import * as dispatchPendingWork from "./conditional-edges/dispatch-pending-work.js";
import * as llmToolCalls from "./conditional-edges/llm-tool-calls.js";
import * as retryDeliverableOrEnd from "./conditional-edges/retry-deliverable-or-end.js";
import { designLlmCall } from "./nodes/designLlmCall/node.js";
import { ensureProfileNode } from "./nodes/ensureProfile/node.js";
import { generateDraftNode } from "./nodes/generateDraft/node.js";
import { inspectProductionNode } from "./nodes/inspectProduction/node.js";
import { llmCall } from "./nodes/llmCall/node.js";
import { resolveContentSpecNode } from "./nodes/resolveContentSpec/node.js";
import { runTools } from "./nodes/runTools/node.js";
import { scheduleProductionNode } from "./nodes/scheduleProduction/node.js";
import { spawnSpecialistNode } from "./nodes/spawnSpecialist/node.js";

export const productionGraph = new StateGraph(AgentState)
  .addNode("ensureProfile", ensureProfileNode)
  .addNode("resolveContentSpec", resolveContentSpecNode)
  .addNode("scheduleProduction", scheduleProductionNode)
  .addNode("llmCall", llmCall)
  .addNode("designLlmCall", designLlmCall)
  .addNode("runTools", runTools)
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
    toolsCondition,
    llmToolCalls.paths,
  )
  .addConditionalEdges(
    llmToolCalls.fromDesign,
    toolsCondition,
    llmToolCalls.paths,
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
