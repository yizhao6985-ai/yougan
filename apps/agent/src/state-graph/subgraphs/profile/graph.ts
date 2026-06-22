import { START, StateGraph } from "@langchain/langgraph";

import { AgentState } from "#agent/state.js";

import { createEnterPhaseNode } from "../../helpers/enter-phase-node.js";
import * as afterMutateProfile from "./conditional-edges/after-mutate-profile.js";
import { finalizeProfileActivitiesNode } from "./nodes/finalize-profile-activities/node.js";
import { mutateProfileNode } from "./nodes/mutate-profile/node.js";
import { runProfileToolsNode } from "./nodes/run-profile-tools/node.js";

export const profileGraph = new StateGraph(AgentState)
  .addNode("enterProfile", createEnterPhaseNode("profile"))
  .addNode("mutateProfile", mutateProfileNode)
  .addNode("runProfileTools", runProfileToolsNode)
  .addNode("finalizeProfileActivities", finalizeProfileActivitiesNode)
  .addEdge(START, "enterProfile")
  .addEdge("enterProfile", "mutateProfile")
  .addConditionalEdges(
    afterMutateProfile.from,
    afterMutateProfile.selectAfterMutateProfile,
    afterMutateProfile.paths,
  )
  .addEdge("runProfileTools", "finalizeProfileActivities")
  .addEdge("finalizeProfileActivities", "mutateProfile")
  .compile();
