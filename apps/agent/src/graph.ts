/**
 * Yougan 主 Graph 入口（langgraph.json 指向此文件）。
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { checkpointer } from "./checkpointer.js";
import * as routeByEntry from "./conditional-edges/route-by-entry.js";
import * as routeAfterSubgraph from "./conditional-edges/route-after-subgraph.js";
import * as routeByMode from "./conditional-edges/route-by-mode.js";
import { askGraph } from "./nodes/ask/graph.js";
import { creationGraph } from "./nodes/creation/graph.js";
import { inspirationGraph } from "./nodes/inspiration/graph.js";
import { resolveTurnModeNode } from "./nodes/resolve-turn-mode/index.js";
import { updateBriefSuggestionsNode } from "./nodes/update-brief-suggestions/index.js";
import { AgentState } from "./state.js";

const workflow = new StateGraph(AgentState)
  .addNode("updateBriefSuggestions", updateBriefSuggestionsNode)
  .addNode("resolveTurnMode", resolveTurnModeNode)
  .addNode("inspirationGraph", inspirationGraph)
  .addNode("creationGraph", creationGraph)
  .addNode("askGraph", askGraph)
  .addConditionalEdges(START, routeByEntry.routeByEntry, routeByEntry.paths)
  .addConditionalEdges(
    "resolveTurnMode",
    routeByMode.routeByMode,
    routeByMode.paths,
  )
  .addEdge("updateBriefSuggestions", END)
  .addConditionalEdges(
    "inspirationGraph",
    routeAfterSubgraph.routeAfterSubgraph,
    routeAfterSubgraph.paths,
  )
  .addConditionalEdges(
    "creationGraph",
    routeAfterSubgraph.routeAfterSubgraph,
    routeAfterSubgraph.paths,
  )
  .addConditionalEdges(
    "askGraph",
    routeAfterSubgraph.routeAfterSubgraph,
    routeAfterSubgraph.paths,
  );

export const graph = workflow.compile({ checkpointer });
