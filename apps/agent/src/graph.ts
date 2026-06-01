/**
 * Yougan 主 Graph 入口（langgraph.json 指向此文件）。
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { inspirationGraph } from "./graphs/inspiration/graph.js";
import { askGraph } from "./graphs/ask/graph.js";
import { checkpointer } from "./checkpointer.js";
import { parseMode } from "./lib/parse-agent-state.js";
import { clearSuggestionsNode } from "./nodes/clear-suggestions/index.js";
import { hydrateWorkMemoryNode } from "./nodes/hydrate-work-memory/index.js";
import { runCreationGraphNode } from "./nodes/run-creation-graph/index.js";
import { AgentState } from "./state.js";

const workflow = new StateGraph(AgentState)
  .addNode("hydrateWorkMemory", hydrateWorkMemoryNode)
  .addNode("inspirationGraph", inspirationGraph)
  .addNode("creationGraph", runCreationGraphNode)
  .addNode("askGraph", askGraph)
  .addNode("clearSuggestions", clearSuggestionsNode)
  .addEdge(START, "hydrateWorkMemory")
  .addConditionalEdges("hydrateWorkMemory", (state) => parseMode(state), {
    inspiration: "inspirationGraph",
    creation: "creationGraph",
    ask: "askGraph",
  })
  .addEdge("inspirationGraph", END)
  .addEdge("creationGraph", "clearSuggestions")
  .addEdge("askGraph", "clearSuggestions")
  .addEdge("clearSuggestions", END);

export const graph = workflow.compile({ checkpointer });
