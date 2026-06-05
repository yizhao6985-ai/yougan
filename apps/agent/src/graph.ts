/**
 * yougan 主图（langgraph.json 入口）
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { checkpointer } from "./checkpointer.js";
import * as commitOrEnd from "./state-graph/conditional-edges/commit-or-end.js";
import * as drainTurnQueue from "./state-graph/conditional-edges/drain-turn-queue.js";
import * as openingOrOrchestrate from "./state-graph/conditional-edges/opening-or-orchestrate.js";
import * as subgraphByTurnKind from "./state-graph/conditional-edges/subgraph-by-turn-kind.js";
import { advanceTurnQueueNode } from "./state-graph/nodes/advance-turn-queue/node.js";
import { commitTurnNode } from "./state-graph/nodes/commit-turn/node.js";
import { dispatchTurnQueueNode } from "./state-graph/nodes/dispatch-turn-queue/node.js";
import { orchestrateTurnNode } from "./state-graph/nodes/orchestrate-turn/node.js";
import { verifyTurnNode } from "./state-graph/nodes/verify-turn/node.js";
import { askGraph } from "./state-graph/subgraphs/ask/graph.js";
import { productionGraph } from "./state-graph/subgraphs/production/graph.js";
import { profileGraph } from "./state-graph/subgraphs/profile/graph.js";
import { AgentState } from "./state.js";

const workflow = new StateGraph(AgentState)
  .addNode("orchestrateTurn", orchestrateTurnNode)
  .addNode("dispatchTurnQueue", dispatchTurnQueueNode)
  .addNode("advanceTurnQueue", advanceTurnQueueNode)
  .addNode("verifyTurn", verifyTurnNode)
  .addNode("commitTurn", commitTurnNode)
  .addNode("profileGraph", profileGraph)
  .addNode("productionGraph", productionGraph)
  .addNode("askGraph", askGraph)
  .addConditionalEdges(
    START,
    openingOrOrchestrate.selectOpeningOrOrchestrate,
    openingOrOrchestrate.paths,
  )
  .addEdge("orchestrateTurn", "dispatchTurnQueue")
  .addConditionalEdges(
    subgraphByTurnKind.from,
    subgraphByTurnKind.selectSubgraphByTurnKind,
    subgraphByTurnKind.paths,
  )
  .addEdge("profileGraph", "advanceTurnQueue")
  .addEdge("productionGraph", "advanceTurnQueue")
  .addEdge("askGraph", "advanceTurnQueue")
  .addConditionalEdges(
    drainTurnQueue.from,
    drainTurnQueue.drainTurnQueueOrVerify,
    drainTurnQueue.paths,
  )
  .addConditionalEdges(
    commitOrEnd.from,
    commitOrEnd.commitTurnOrEnd,
    commitOrEnd.paths,
  )
  .addEdge("commitTurn", END);

export const graph = workflow.compile({ checkpointer });
