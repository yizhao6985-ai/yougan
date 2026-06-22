import { END, START, StateGraph } from "@langchain/langgraph";

import { AgentState } from "#agent/state.js";

import { createEnterPhaseNode } from "../../helpers/enter-phase-node.js";
import * as afterGenerateTurnDirections from "./conditional-edges/after-generate-turn-directions.js";
import { composeTurnBriefingNode } from "./nodes/compose-turn-briefing/node.js";
import { generateTurnDirectionsNode } from "./nodes/generate-turn-directions/node.js";

/** 回合简报：延伸方向 → 流式评鉴与方向展望 */
export const turnBriefingGraph = new StateGraph(AgentState)
  .addNode("enterTurnBriefing", createEnterPhaseNode("turn_briefing"))
  .addNode("generateTurnDirections", generateTurnDirectionsNode)
  .addNode("composeTurnBriefing", composeTurnBriefingNode)
  .addEdge(START, "enterTurnBriefing")
  .addEdge("enterTurnBriefing", "generateTurnDirections")
  .addConditionalEdges(
    afterGenerateTurnDirections.from,
    afterGenerateTurnDirections.selectAfterGenerateTurnDirections,
    afterGenerateTurnDirections.paths,
  )
  .addEdge("composeTurnBriefing", END)
  .compile();
