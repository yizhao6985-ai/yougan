import { END, START, StateGraph } from "@langchain/langgraph";
import { toolsCondition } from "@langchain/langgraph/prebuilt";

import { AgentState } from "#agent/state.js";

import { createEnterPhaseNode } from "../../helpers/enter-phase-node.js";
import * as afterMutateProfile from "./conditional-edges/after-mutate-profile.js";
import { finalizeProfileNode } from "./nodes/finalize-profile/node.js";
import { mutateProfileNode } from "./nodes/mutate-profile/node.js";
import { runProfileToolsNode } from "./nodes/run-profile-tools/node.js";

export const profileGraph = new StateGraph(AgentState)
  .addNode("enterProfile", createEnterPhaseNode("profile"))
  .addNode("mutateProfile", mutateProfileNode)
  .addNode("runProfileTools", runProfileToolsNode)
  .addNode("finalizeProfile", finalizeProfileNode)
  .addEdge(START, "enterProfile")
  .addEdge("enterProfile", "mutateProfile")
  .addConditionalEdges(
    afterMutateProfile.from,
    toolsCondition,
    afterMutateProfile.paths,
  )
  .addEdge("runProfileTools", "mutateProfile")
  .addEdge("finalizeProfile", END)
  .compile();
