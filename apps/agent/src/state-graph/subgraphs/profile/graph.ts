import { START, StateGraph } from "@langchain/langgraph";
import { toolsCondition } from "@langchain/langgraph/prebuilt";

import { AgentState } from "#agent/state.js";

import * as afterConsultProfile from "./conditional-edges/after-consult-profile.js";
import { consultProfileNode } from "./nodes/consult-profile/node.js";
import { runProfileToolsNode } from "./nodes/run-profile-tools/node.js";

export const profileGraph = new StateGraph(AgentState)
  .addNode("consultProfile", consultProfileNode)
  .addNode("runProfileTools", runProfileToolsNode)
  .addEdge(START, "consultProfile")
  .addConditionalEdges(
    afterConsultProfile.from,
    toolsCondition,
    afterConsultProfile.paths,
  )
  .addEdge("runProfileTools", "consultProfile")
  .compile();
