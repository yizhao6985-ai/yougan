import { END, START, StateGraph } from "@langchain/langgraph";
import { toolsCondition } from "@langchain/langgraph/prebuilt";

import { AgentState } from "#agent/state.js";

import * as afterMutateProfile from "./conditional-edges/after-mutate-profile.js";
import { mutateProfileNode } from "./nodes/mutate-profile/node.js";
import { runProfileToolsNode } from "./nodes/run-profile-tools/node.js";
import { summarizeProfileNode } from "./nodes/summarize-profile/node.js";

export const profileGraph = new StateGraph(AgentState)
  .addNode("mutateProfile", mutateProfileNode)
  .addNode("runProfileTools", runProfileToolsNode)
  .addNode("summarizeProfile", summarizeProfileNode)
  .addEdge(START, "mutateProfile")
  .addConditionalEdges(
    afterMutateProfile.from,
    toolsCondition,
    afterMutateProfile.paths,
  )
  .addEdge("runProfileTools", "mutateProfile")
  .addEdge("summarizeProfile", END)
  .compile();
