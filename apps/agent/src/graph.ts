/**
 * Yougan 主 Graph 入口（langgraph.json 指向此文件）。
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { checkpointer } from "./checkpointer.js";
import * as routeByEntry from "./logic/route-by-entry.js";
import { askGraph } from "./nodes/ask/graph.js";
import { clearBriefSuggestionsNode } from "./nodes/clear-suggestions.js";
import { creationGraph } from "./nodes/creation/graph.js";
import { inspirationGraph } from "./nodes/inspiration/graph.js";
import { recommendConversationNode } from "./nodes/recommend-conversation/index.js";
import { AgentState } from "./state.js";

const workflow = new StateGraph(AgentState)
  .addNode("recommendConversation", recommendConversationNode)
  .addNode("inspirationGraph", inspirationGraph)
  .addNode("creationGraph", creationGraph)
  .addNode("askGraph", askGraph)
  .addNode("clearSuggestions", clearBriefSuggestionsNode)
  .addConditionalEdges(START, routeByEntry.routeByEntry, routeByEntry.paths)
  .addEdge("recommendConversation", END)
  .addEdge("inspirationGraph", END)
  .addEdge("creationGraph", "clearSuggestions")
  .addEdge("askGraph", "clearSuggestions")
  .addEdge("clearSuggestions", END);

export const graph = workflow.compile({ checkpointer });
