import { END, START, StateGraph } from "@langchain/langgraph";

import { AgentState } from "#agent/state.js";

import { createEnterPhaseNode } from "../../helpers/enter-phase-node.js";
import { generateSuggestionsNode } from "./nodes/generate-suggestions/node.js";

export const suggestionsGraph = new StateGraph(AgentState)
  .addNode("enterSuggestions", createEnterPhaseNode("suggestions"))
  .addNode("generateSuggestions", generateSuggestionsNode)
  .addEdge(START, "enterSuggestions")
  .addEdge("enterSuggestions", "generateSuggestions")
  .addEdge("generateSuggestions", END)
  .compile();
