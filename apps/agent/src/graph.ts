/**
 * yougan 主图（langgraph.json 入口）
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { checkpointer } from "./checkpointer.js";
import * as commitOrEnd from "./state-graph/conditional-edges/commit-or-end.js";
import * as drainTurnQueue from "./state-graph/conditional-edges/drain-turn-queue.js";
import * as openingOrWorkflow from "./state-graph/conditional-edges/opening-or-workflow.js";
import * as subgraphByTurnKind from "./state-graph/conditional-edges/subgraph-by-turn-kind.js";
import { advanceTurnQueueNode } from "./state-graph/nodes/advance-turn-queue/node.js";
import { commitTurnNode } from "./state-graph/nodes/commit-turn/node.js";
import { dispatchTurnQueueNode } from "./state-graph/nodes/dispatch-turn-queue/node.js";
import { generateSuggestionsNode } from "./state-graph/nodes/generate-suggestions/node.js";
import { generateTitleNode } from "./state-graph/nodes/generate-title/node.js";
import { routeTurnEndNode } from "./state-graph/nodes/route-turn-end/node.js";
import { workflowTurnNode } from "./state-graph/nodes/workflow-turn/node.js";
import { askGraph } from "./state-graph/subgraphs/ask/graph.js";
import { productionGraph } from "./state-graph/subgraphs/production/graph.js";
import { profileGraph } from "./state-graph/subgraphs/profile/graph.js";
import { referenceGraph } from "./state-graph/subgraphs/reference/graph.js";
import { AgentState } from "./state.js";

const workflow = new StateGraph(AgentState)
  .addNode("workflowTurn", workflowTurnNode)
  .addNode("dispatchTurnQueue", dispatchTurnQueueNode)
  .addNode("advanceTurnQueue", advanceTurnQueueNode)
  .addNode("routeTurnEnd", routeTurnEndNode)
  .addNode("generateSuggestions", generateSuggestionsNode)
  .addNode("generateTitle", generateTitleNode)
  .addNode("commitTurn", commitTurnNode)
  .addNode("referenceGraph", referenceGraph)
  .addNode("profileGraph", profileGraph)
  .addNode("productionGraph", productionGraph)
  .addNode("askGraph", askGraph)
  .addConditionalEdges(
    START,
    openingOrWorkflow.selectOpeningOrWorkflow,
    openingOrWorkflow.paths,
  )
  .addEdge("workflowTurn", "dispatchTurnQueue")
  .addConditionalEdges(
    subgraphByTurnKind.from,
    subgraphByTurnKind.selectSubgraphByTurnKind,
    subgraphByTurnKind.paths,
  )
  .addEdge("referenceGraph", "advanceTurnQueue")
  .addEdge("profileGraph", "advanceTurnQueue")
  .addEdge("productionGraph", "advanceTurnQueue")
  .addEdge("askGraph", "advanceTurnQueue")
  .addConditionalEdges(
    drainTurnQueue.from,
    drainTurnQueue.drainTurnQueueOrVerify,
    drainTurnQueue.paths,
  )
  .addEdge("routeTurnEnd", "generateSuggestions")
  .addEdge("routeTurnEnd", "generateTitle")
  .addConditionalEdges(
    "generateSuggestions",
    commitOrEnd.commitTurnOrEnd,
    commitOrEnd.paths,
  )
  .addConditionalEdges(
    "generateTitle",
    commitOrEnd.commitTurnOrEnd,
    commitOrEnd.paths,
  )
  .addEdge("commitTurn", END);

export const graph = workflow.compile({ checkpointer });
