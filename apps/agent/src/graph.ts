/**
 * yougan 主图（langgraph.json 入口）
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { checkpointer } from "./checkpointer.js";
import * as afterConfirmProductionTurn from "./state-graph/conditional-edges/after-confirm-production-turn.js";
import * as afterAdvanceTurnQueue from "./state-graph/conditional-edges/after-advance-turn-queue.js";
import * as afterDispatchTurnQueue from "./state-graph/conditional-edges/after-dispatch-turn-queue.js";
import * as afterGateAiQuota from "./state-graph/conditional-edges/after-gate-ai-quota.js";
import * as atGraphStart from "./state-graph/conditional-edges/at-graph-start.js";
import { confirmProductionTurnNode } from "./state-graph/nodes/confirm-production-turn/node.js";
import { advanceTurnQueueNode } from "./state-graph/nodes/advance-turn-queue/node.js";
import { commitTurnNode } from "./state-graph/nodes/commit-turn/node.js";
import { dispatchTurnQueueNode } from "./state-graph/nodes/dispatch-turn-queue/node.js";
import { finalizeRunMeteringNode } from "./state-graph/nodes/finalize-run-metering/node.js";
import { gateAiQuotaNode } from "./state-graph/nodes/gate-ai-quota/node.js";
import { planTurnQueueNode } from "./state-graph/nodes/plan-turn-queue/node.js";
import { summarizeMessagesNode } from "./state-graph/nodes/summarize-messages/node.js";
import { askGraph } from "./state-graph/subgraphs/ask/graph.js";
import { productionGraph } from "./state-graph/subgraphs/production/graph.js";
import { profileGraph } from "./state-graph/subgraphs/profile/graph.js";
import { referenceGraph } from "./state-graph/subgraphs/reference/graph.js";
import { suggestionsGraph } from "./state-graph/subgraphs/suggestions/graph.js";
import { AgentState } from "./state.js";

const workflow = new StateGraph(AgentState)
  .addNode("gateAiQuota", gateAiQuotaNode)
  .addNode("finalizeRunMetering", finalizeRunMeteringNode)
  .addNode("planTurnQueue", planTurnQueueNode)
  .addNode("dispatchTurnQueue", dispatchTurnQueueNode)
  .addNode("confirmProductionTurn", confirmProductionTurnNode)
  .addNode("advanceTurnQueue", advanceTurnQueueNode)
  .addNode("commitTurn", commitTurnNode)
  .addNode("summarizeMessages", summarizeMessagesNode)
  .addNode("referenceGraph", referenceGraph)
  .addNode("profileGraph", profileGraph)
  .addNode("productionGraph", productionGraph)
  .addNode("askGraph", askGraph)
  .addNode("suggestionsGraph", suggestionsGraph)
  .addConditionalEdges(
    START,
    atGraphStart.selectAtGraphStart,
    atGraphStart.paths,
  )
  .addConditionalEdges(
    afterGateAiQuota.from,
    afterGateAiQuota.selectAfterGateAiQuota,
    afterGateAiQuota.paths,
  )
  .addEdge("finalizeRunMetering", END)
  .addEdge("planTurnQueue", "dispatchTurnQueue")
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
  .addEdge("referenceGraph", "advanceTurnQueue")
  .addEdge("profileGraph", "advanceTurnQueue")
  .addEdge("productionGraph", "advanceTurnQueue")
  .addEdge("askGraph", "advanceTurnQueue")
  .addEdge("suggestionsGraph", "advanceTurnQueue")
  .addConditionalEdges(
    afterAdvanceTurnQueue.from,
    afterAdvanceTurnQueue.selectAfterAdvanceTurnQueue,
    afterAdvanceTurnQueue.paths,
  )
  .addEdge("commitTurn", "summarizeMessages")
  .addEdge("summarizeMessages", "finalizeRunMetering");

export const graph = workflow.compile({ checkpointer });
