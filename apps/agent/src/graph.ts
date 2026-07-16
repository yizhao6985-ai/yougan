/**
 * yougan 主图（langgraph.json 入口）
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { LLM_TIMEOUT_MS, llmNodePolicy, llmTimeoutOnly } from "#agent/llm/invoke/timeout.js";

import { checkpointer } from "./checkpointer.js";
import * as afterConfirmProductionTurn from "./state-graph/conditional-edges/after-confirm-production-turn.js";
import * as afterConfirmReviseTurn from "./state-graph/conditional-edges/after-confirm-revise-turn.js";
import * as afterAdvanceTurnQueue from "./state-graph/conditional-edges/after-advance-turn-queue.js";
import * as afterDispatchTurnQueue from "./state-graph/conditional-edges/after-dispatch-turn-queue.js";
import {
  asNodeErrorHandler,
  withErrorHandlerDrawingPath,
} from "./state-graph/helpers/as-node-error-handler.js";
import { confirmProductionTurnNode } from "./state-graph/nodes/confirm-production-turn/node.js";
import { confirmReviseTurnNode } from "./state-graph/nodes/confirm-revise-turn/node.js";
import { advanceTurnQueueNode } from "./state-graph/nodes/advance-turn-queue/node.js";
import { commitTurnNode } from "./state-graph/nodes/commit-turn/node.js";
import { dispatchTurnQueueNode } from "./state-graph/nodes/dispatch-turn-queue/node.js";
import {
  generateTurnDirectionsErrorHandler,
  generateTurnDirectionsNode,
} from "./state-graph/nodes/generate-turn-directions/node.js";
import {
  planTurnQueueErrorHandler,
  planTurnQueueNode,
} from "./state-graph/nodes/plan-turn-queue/node.js";
import {
  summarizeMessagesErrorHandler,
  summarizeMessagesNode,
} from "./state-graph/nodes/summarize-messages/node.js";
import { finalizeRunMeteringNode } from "./state-graph/nodes/finalize-run-metering/node.js";
import { askGraph } from "./state-graph/subgraphs/ask/graph.js";
import { collectRevisionGraph } from "./state-graph/subgraphs/collect-revision/graph.js";
import { productionGraph } from "./state-graph/subgraphs/production/graph.js";
import { profileGraph } from "./state-graph/subgraphs/profile/graph.js";
import { reviseGraph } from "./state-graph/subgraphs/revise/graph.js";
import { AgentState } from "./state.js";

const workflow = new StateGraph(AgentState)
  .addNode("planTurnQueue", planTurnQueueNode, {
    ...llmNodePolicy(LLM_TIMEOUT_MS.structured),
    errorHandler: asNodeErrorHandler(planTurnQueueErrorHandler),
  })
  .addNode("dispatchTurnQueue", dispatchTurnQueueNode)
  .addNode("confirmProductionTurn", confirmProductionTurnNode)
  .addNode("confirmReviseTurn", confirmReviseTurnNode)
  .addNode("advanceTurnQueue", advanceTurnQueueNode)
  .addNode("generateTurnDirections", generateTurnDirectionsNode, {
    ...llmTimeoutOnly(LLM_TIMEOUT_MS.suggestions),
    errorHandler: asNodeErrorHandler(generateTurnDirectionsErrorHandler),
  })
  .addNode("commitTurn", commitTurnNode)
  .addNode("summarizeMessages", summarizeMessagesNode, {
    ...llmTimeoutOnly(LLM_TIMEOUT_MS.structured),
    errorHandler: asNodeErrorHandler(summarizeMessagesErrorHandler),
  })
  .addNode("finalizeRunMetering", finalizeRunMeteringNode)
  .addNode("profileGraph", profileGraph)
  .addNode("productionGraph", productionGraph)
  .addNode("collectRevisionGraph", collectRevisionGraph)
  .addNode("reviseGraph", reviseGraph)
  .addNode("askGraph", askGraph)
  .addEdge(START, "planTurnQueue")
  .addConditionalEdges(
    "planTurnQueue",
    () => "dispatchTurnQueue",
    withErrorHandlerDrawingPath("planTurnQueue", {
      dispatchTurnQueue: "dispatchTurnQueue",
    } as const),
  )
  .addConditionalEdges(
    afterDispatchTurnQueue.from,
    afterDispatchTurnQueue.selectAfterDispatchTurnQueue,
    afterDispatchTurnQueue.paths,
  )
  .addConditionalEdges(
    "confirmProductionTurn",
    afterConfirmProductionTurn.selectAfterConfirmProductionTurn,
    afterConfirmProductionTurn.paths,
  )
  .addConditionalEdges(
    "confirmReviseTurn",
    afterConfirmReviseTurn.selectAfterConfirmReviseTurn,
    afterConfirmReviseTurn.paths,
  )
  .addEdge("profileGraph", "advanceTurnQueue")
  .addEdge("productionGraph", "advanceTurnQueue")
  .addEdge("collectRevisionGraph", "advanceTurnQueue")
  .addEdge("reviseGraph", "advanceTurnQueue")
  .addEdge("askGraph", "advanceTurnQueue")
  .addConditionalEdges(
    afterAdvanceTurnQueue.from,
    afterAdvanceTurnQueue.selectAfterAdvanceTurnQueue,
    afterAdvanceTurnQueue.paths,
  )
  .addConditionalEdges(
    "generateTurnDirections",
    () => "commitTurn",
    withErrorHandlerDrawingPath("generateTurnDirections", {
      commitTurn: "commitTurn",
    } as const),
  )
  .addEdge("commitTurn", "summarizeMessages")
  .addConditionalEdges(
    "summarizeMessages",
    () => "finalizeRunMetering",
    withErrorHandlerDrawingPath("summarizeMessages", {
      finalizeRunMetering: "finalizeRunMetering",
    } as const),
  )
  .addEdge("finalizeRunMetering", END);

export const graph = workflow.compile({ checkpointer });
