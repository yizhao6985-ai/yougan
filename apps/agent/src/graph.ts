/**
 * Yougan 主 Graph 入口（langgraph.json 指向此文件）。
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { checkpointer } from "./checkpointer.js";
import * as routeByEntry from "./conditional-edges/route-by-entry.js";
import * as routeAfterTurnQueue from "./conditional-edges/route-after-turn-queue.js";
import * as routeByTurnQueue from "./conditional-edges/route-by-turn-queue.js";
import { askGraph } from "./nodes/ask/graph.js";
import { blueprintGraph } from "./nodes/blueprint/graph.js";
import { creationGraph } from "./nodes/creation/graph.js";
import { resolveTurnQueueNode } from "./nodes/resolve-turn-queue/index.js";
import { advanceTurnQueueNode } from "./nodes/turn-queue/advance.js";
import { dispatchTurnQueueNode } from "./nodes/turn-queue/dispatch.js";
import { updateNextStepSuggestionsNode } from "./nodes/next-step-suggestions/index.js";
import { AgentState } from "./state.js";

const workflow = new StateGraph(AgentState)
  .addNode("updateNextStepSuggestions", updateNextStepSuggestionsNode)
  .addNode("resolveTurnQueue", resolveTurnQueueNode)
  .addNode("dispatchTurnQueue", dispatchTurnQueueNode)
  .addNode("advanceTurnQueue", advanceTurnQueueNode)
  .addNode("blueprintGraph", blueprintGraph)
  .addNode("creationGraph", creationGraph)
  .addNode("askGraph", askGraph)
  .addConditionalEdges(START, routeByEntry.routeByEntry, routeByEntry.paths)
  .addEdge("resolveTurnQueue", "dispatchTurnQueue")
  .addConditionalEdges(
    "dispatchTurnQueue",
    routeByTurnQueue.routeByTurnQueue,
    routeByTurnQueue.paths,
  )
  .addEdge("blueprintGraph", "advanceTurnQueue")
  .addEdge("creationGraph", "advanceTurnQueue")
  .addEdge("askGraph", "advanceTurnQueue")
  .addConditionalEdges(
    "advanceTurnQueue",
    routeAfterTurnQueue.routeAfterTurnQueue,
    routeAfterTurnQueue.paths,
  )
  .addEdge("updateNextStepSuggestions", END);

export const graph = workflow.compile({ checkpointer });
