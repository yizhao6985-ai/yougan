/**
 * yougan 主图（langgraph.json 入口）
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { checkpointer } from "./checkpointer.js";
import * as afterAdvanceTurnQueue from "./state-graph/conditional-edges/after-advance-turn-queue.js";
import * as openingOrWorkflow from "./state-graph/conditional-edges/opening-or-workflow.js";
import * as subgraphByTurnKind from "./state-graph/conditional-edges/subgraph-by-turn-kind.js";
import { advanceTurnQueueNode } from "./state-graph/nodes/advance-turn-queue/node.js";
import { afterCommitNode } from "./state-graph/nodes/after-commit/node.js";
import { commitTurnNode } from "./state-graph/nodes/commit-turn/node.js";
import { dispatchTurnQueueNode } from "./state-graph/nodes/dispatch-turn-queue/node.js";
import { generateSuggestionsNode } from "./state-graph/nodes/generate-suggestions/node.js";
import { generateTitleNode } from "./state-graph/nodes/generate-title/node.js";
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
  .addNode("commitTurn", commitTurnNode)
  .addNode("afterCommit", afterCommitNode)
  .addNode("generateSuggestions", generateSuggestionsNode)
  .addNode("generateTitle", generateTitleNode)
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
    afterAdvanceTurnQueue.from,
    afterAdvanceTurnQueue.selectAfterAdvanceTurnQueue,
    afterAdvanceTurnQueue.paths,
  )
  .addEdge("commitTurn", "afterCommit")
  .addEdge("afterCommit", "generateSuggestions")
  .addEdge("afterCommit", "generateTitle")
  .addEdge("generateSuggestions", END)
  .addEdge("generateTitle", END);

export const graph = workflow.compile({ checkpointer });
