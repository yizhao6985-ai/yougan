/**
 * 灵感模式子图：prepare → llmCall ⇄ tools → generateSuggestions。
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import * as afterLlm from "./conditional-edges/after-llm.js";
import { generateSuggestionsNode } from "./nodes/generate-suggestions.js";
import { llmCall } from "./nodes/llm-call.js";
import { prepareInspirationTurnNode } from "./nodes/prepare-turn.js";
import { toolNode } from "./nodes/tools.js";
import { AgentState } from "../../state.js";

const inspirationWorkflow = new StateGraph(AgentState)
  .addNode("prepare", prepareInspirationTurnNode)
  .addNode("llmCall", llmCall)
  .addNode("tools", toolNode)
  .addNode("generateSuggestions", generateSuggestionsNode)
  .addEdge(START, "prepare")
  .addEdge("prepare", "llmCall")
  .addConditionalEdges(afterLlm.from, afterLlm.shouldContinue, afterLlm.paths)
  .addEdge("tools", "llmCall")
  .addEdge("generateSuggestions", END);

export const inspirationGraph = inspirationWorkflow.compile();
