/**
 * yougan 主图（langgraph.json 入口）
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { checkpointer } from "./checkpointer.js";
import * as afterConfirmProductionTurn from "./state-graph/conditional-edges/after-confirm-production-turn.js";
import * as afterConfirmReviseTurn from "./state-graph/conditional-edges/after-confirm-revise-turn.js";
import * as afterAdvanceTurnQueue from "./state-graph/conditional-edges/after-advance-turn-queue.js";
import * as afterDispatchTurnQueue from "./state-graph/conditional-edges/after-dispatch-turn-queue.js";
import * as atGraphStart from "./state-graph/conditional-edges/at-graph-start.js";
import { confirmProductionTurnNode } from "./state-graph/nodes/confirm-production-turn/node.js";
import { confirmReviseTurnNode } from "./state-graph/nodes/confirm-revise-turn/node.js";
import { enterProductionConfirmNode } from "./state-graph/nodes/enter-production-confirm/node.js";
import { enterReviseConfirmNode } from "./state-graph/nodes/enter-revise-confirm/node.js";
import { setTurnPlanningProgressNode } from "./state-graph/nodes/set-turn-planning-progress/node.js";
import { advanceTurnQueueNode } from "./state-graph/nodes/advance-turn-queue/node.js";
import { commitTurnNode } from "./state-graph/nodes/commit-turn/node.js";
import { dispatchTurnQueueNode } from "./state-graph/nodes/dispatch-turn-queue/node.js";
import { planTurnQueueNode } from "./state-graph/nodes/plan-turn-queue/node.js";
import { summarizeMessagesNode } from "./state-graph/nodes/summarize-messages/node.js";
import { enterSummarizeMessagesNode } from "./state-graph/nodes/enter-summarize-messages/node.js";
import { finalizeRunMeteringNode } from "./state-graph/nodes/finalize-run-metering/node.js";
import { askGraph } from "./state-graph/subgraphs/ask/graph.js";
import { collectRevisionGraph } from "./state-graph/subgraphs/collect-revision/graph.js";
import { productionGraph } from "./state-graph/subgraphs/production/graph.js";
import { profileGraph } from "./state-graph/subgraphs/profile/graph.js";
import { referenceGraph } from "./state-graph/subgraphs/reference/graph.js";
import { reviseGraph } from "./state-graph/subgraphs/revise/graph.js";
import { turnBriefingGraph } from "./state-graph/subgraphs/turn-briefing/graph.js";
import { AgentState } from "./state.js";

const workflow = new StateGraph(AgentState)
  .addNode("setTurnPlanningProgress", setTurnPlanningProgressNode)
  .addNode("planTurnQueue", planTurnQueueNode)
  .addNode("dispatchTurnQueue", dispatchTurnQueueNode)
  .addNode("enterProductionConfirm", enterProductionConfirmNode)
  .addNode("confirmProductionTurn", confirmProductionTurnNode)
  .addNode("enterReviseConfirm", enterReviseConfirmNode)
  .addNode("confirmReviseTurn", confirmReviseTurnNode)
  .addNode("advanceTurnQueue", advanceTurnQueueNode)
  .addNode("turnBriefingGraph", turnBriefingGraph)
  .addNode("commitTurn", commitTurnNode)
  .addNode("summarizeMessages", summarizeMessagesNode)
  .addNode("enterSummarizeMessages", enterSummarizeMessagesNode)
  .addNode("finalizeRunMetering", finalizeRunMeteringNode)
  .addNode("referenceGraph", referenceGraph)
  .addNode("profileGraph", profileGraph)
  .addNode("productionGraph", productionGraph)
  .addNode("collectRevisionGraph", collectRevisionGraph)
  .addNode("reviseGraph", reviseGraph)
  .addNode("askGraph", askGraph)
  .addConditionalEdges(
    START,
    atGraphStart.selectAtGraphStart,
    atGraphStart.paths,
  )
  .addEdge("setTurnPlanningProgress", "planTurnQueue")
  .addEdge("planTurnQueue", "dispatchTurnQueue")
  .addConditionalEdges(
    afterDispatchTurnQueue.from,
    afterDispatchTurnQueue.selectAfterDispatchTurnQueue,
    afterDispatchTurnQueue.paths,
  )
  .addEdge("enterProductionConfirm", "confirmProductionTurn")
  .addConditionalEdges(
    "confirmProductionTurn",
    afterConfirmProductionTurn.selectAfterConfirmProductionTurn,
    afterConfirmProductionTurn.paths,
  )
  .addEdge("enterReviseConfirm", "confirmReviseTurn")
  .addConditionalEdges(
    "confirmReviseTurn",
    afterConfirmReviseTurn.selectAfterConfirmReviseTurn,
    afterConfirmReviseTurn.paths,
  )
  .addEdge("referenceGraph", "advanceTurnQueue")
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
  .addEdge("turnBriefingGraph", "commitTurn")
  .addEdge("commitTurn", "enterSummarizeMessages")
  .addEdge("enterSummarizeMessages", "summarizeMessages")
  .addEdge("summarizeMessages", "finalizeRunMetering")
  .addEdge("finalizeRunMetering", END);

export const graph = workflow.compile({ checkpointer });
