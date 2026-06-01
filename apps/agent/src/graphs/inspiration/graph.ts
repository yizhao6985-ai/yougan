/**
 * 灵感模式子图：prepare → react → generateSuggestions。
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { generateInspirationSuggestionsNode } from "./nodes/generate-suggestions/index.js";
import { prepareInspirationTurnNode } from "./nodes/prepare-turn/index.js";
import { inspirationReactNode } from "./nodes/react/index.js";
import { AgentState } from "../../state.js";

const inspirationWorkflow = new StateGraph(AgentState)
  .addNode("prepare", prepareInspirationTurnNode)
  .addNode("react", inspirationReactNode)
  .addNode("generateSuggestions", generateInspirationSuggestionsNode)
  .addEdge(START, "prepare")
  .addEdge("prepare", "react")
  .addEdge("react", "generateSuggestions")
  .addEdge("generateSuggestions", END);

export const inspirationGraph = inspirationWorkflow.compile();
