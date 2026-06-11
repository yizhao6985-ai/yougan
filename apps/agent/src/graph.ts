/**
 * yougan 主图（langgraph.json 入口）
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { checkpointer } from "./checkpointer.js";
import * as afterAdvanceTurnQueue from "./state-graph/conditional-edges/after-advance-turn-queue.js";
import * as afterDispatchTurnQueue from "./state-graph/conditional-edges/after-dispatch-turn-queue.js";
import * as atGraphStart from "./state-graph/conditional-edges/at-graph-start.js";
import { advanceTurnQueueNode } from "./state-graph/nodes/advance-turn-queue/node.js";
import { commitTurnNode } from "./state-graph/nodes/commit-turn/node.js";
import { dispatchTurnQueueNode } from "./state-graph/nodes/dispatch-turn-queue/node.js";
import { forkPostCommitNode } from "./state-graph/nodes/fork-post-commit/node.js";
import { generateSuggestionsNode } from "./state-graph/nodes/generate-suggestions/node.js";
import { generateTitleNode } from "./state-graph/nodes/generate-title/node.js";
import { planTurnQueueNode } from "./state-graph/nodes/plan-turn-queue/node.js";
import { askGraph } from "./state-graph/subgraphs/ask/graph.js";
import { productionGraph } from "./state-graph/subgraphs/production/graph.js";
import { profileGraph } from "./state-graph/subgraphs/profile/graph.js";
import { referenceGraph } from "./state-graph/subgraphs/reference/graph.js";
import { AgentState } from "./state.js";

const workflow = new StateGraph(AgentState)
  .addNode("planTurnQueue", planTurnQueueNode)
  .addNode("dispatchTurnQueue", dispatchTurnQueueNode)
  .addNode("advanceTurnQueue", advanceTurnQueueNode)
  .addNode("commitTurn", commitTurnNode)
  .addNode("forkPostCommit", forkPostCommitNode)
  .addNode("generateSuggestions", generateSuggestionsNode)
  .addNode("generateTitle", generateTitleNode)
  .addNode("referenceGraph", referenceGraph)
  .addNode("profileGraph", profileGraph)
  .addNode("productionGraph", productionGraph)
  .addNode("askGraph", askGraph)
  .addConditionalEdges(
    START,
    atGraphStart.selectAtGraphStart,
    atGraphStart.paths,
  )
  .addEdge("planTurnQueue", "dispatchTurnQueue")
  .addConditionalEdges(
    afterDispatchTurnQueue.from,
    afterDispatchTurnQueue.selectAfterDispatchTurnQueue,
    afterDispatchTurnQueue.paths,
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
  .addEdge("commitTurn", "forkPostCommit")
  .addEdge("forkPostCommit", "generateSuggestions")
  .addEdge("forkPostCommit", "generateTitle")
  .addEdge("generateSuggestions", END)
  .addEdge("generateTitle", END);

export const graph = workflow.compile({ checkpointer });
