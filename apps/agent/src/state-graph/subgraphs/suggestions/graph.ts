import { END, START, StateGraph } from "@langchain/langgraph";

import { AgentState } from "#agent/state.js";

import { generateSuggestionsNode } from "./nodes/generate-suggestions/node.js";

export const suggestionsGraph = new StateGraph(AgentState)
  .addNode("generateSuggestions", generateSuggestionsNode)
  .addEdge(START, "generateSuggestions")
  .addEdge("generateSuggestions", END)
  .compile();
