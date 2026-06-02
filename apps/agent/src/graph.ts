/**
 * Yougan 主 Graph 入口（langgraph.json 指向此文件）。
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { checkpointer } from "./checkpointer.js";
import * as routeByEntry from "./conditional-edges/route-by-entry.js";
import * as routeAfterBriefSuggestions from "./conditional-edges/route-after-brief-suggestions.js";
import * as routeAfterTurnTask from "./conditional-edges/route-after-turn-task.js";
import * as routeByTurnTask from "./conditional-edges/route-by-turn-task.js";
import { askGraph } from "./nodes/ask/graph.js";
import { creationGraph } from "./nodes/creation/graph.js";
import { inspirationGraph } from "./nodes/inspiration/graph.js";
import { outlineGraph } from "./nodes/outline/graph.js";
import { resolveTurnQueueNode } from "./nodes/resolve-turn-queue/index.js";
import { advanceTurnQueueNode } from "./nodes/turn-task/advance.js";
import { turnTaskBriefNode } from "./nodes/turn-task/brief.js";
import { dispatchTurnTaskNode } from "./nodes/turn-task/dispatch.js";
import { turnTaskEnsureOutlineNode } from "./nodes/turn-task/ensure-outline.js";
import { turnTaskOutlinePatchNode } from "./nodes/turn-task/outline-patch.js";
import { turnTaskReferencesNode } from "./nodes/turn-task/references.js";
import { updateBriefSuggestionsNode } from "./nodes/update-brief-suggestions/index.js";
import { AgentState } from "./state.js";

const workflow = new StateGraph(AgentState)
  .addNode("updateBriefSuggestions", updateBriefSuggestionsNode)
  .addNode("resolveTurnQueue", resolveTurnQueueNode)
  .addNode("dispatchTurnTask", dispatchTurnTaskNode)
  .addNode("advanceTurnQueue", advanceTurnQueueNode)
  .addNode("turnTaskReferences", turnTaskReferencesNode)
  .addNode("turnTaskBrief", turnTaskBriefNode)
  .addNode("turnTaskEnsureOutline", turnTaskEnsureOutlineNode)
  .addNode("turnTaskOutlinePatch", turnTaskOutlinePatchNode)
  .addNode("inspirationGraph", inspirationGraph)
  .addNode("outlineGraph", outlineGraph)
  .addNode("creationGraph", creationGraph)
  .addNode("askGraph", askGraph)
  .addConditionalEdges(START, routeByEntry.routeByEntry, routeByEntry.paths)
  .addEdge("resolveTurnQueue", "dispatchTurnTask")
  .addConditionalEdges(
    "dispatchTurnTask",
    routeByTurnTask.routeByTurnTask,
    routeByTurnTask.paths,
  )
  .addEdge("turnTaskReferences", "advanceTurnQueue")
  .addEdge("turnTaskBrief", "advanceTurnQueue")
  .addEdge("turnTaskEnsureOutline", "advanceTurnQueue")
  .addEdge("turnTaskOutlinePatch", "advanceTurnQueue")
  .addEdge("inspirationGraph", "advanceTurnQueue")
  .addEdge("outlineGraph", "advanceTurnQueue")
  .addEdge("creationGraph", "advanceTurnQueue")
  .addEdge("askGraph", "advanceTurnQueue")
  .addConditionalEdges(
    "advanceTurnQueue",
    routeAfterTurnTask.routeAfterTurnTask,
    routeAfterTurnTask.paths,
  )
  .addConditionalEdges(
    "updateBriefSuggestions",
    routeAfterBriefSuggestions.routeAfterBriefSuggestions,
    routeAfterBriefSuggestions.paths,
  );

export const graph = workflow.compile({ checkpointer });
