import { START, StateGraph } from "@langchain/langgraph";

import {
  LLM_TIMEOUT_MS,
  llmTimeoutOnly,
} from "#agent/llm/invoke/timeout.js";
import { AgentState } from "#agent/state.js";

import {
  asNodeErrorHandler,
  withErrorHandlerDrawingPath,
} from "../../helpers/as-node-error-handler.js";
import * as afterMutateProfile from "./conditional-edges/after-mutate-profile.js";
import {
  mutateProfileErrorHandler,
  mutateProfileNode,
} from "./nodes/mutate-profile/node.js";
import { runProfileToolsNode } from "./nodes/run-profile-tools/node.js";

export const profileGraph = new StateGraph(AgentState)
  .addNode("mutateProfile", mutateProfileNode, {
    ...llmTimeoutOnly(LLM_TIMEOUT_MS.chat),
    errorHandler: asNodeErrorHandler(mutateProfileErrorHandler),
  })
  .addNode("runProfileTools", runProfileToolsNode)
  .addEdge(START, "mutateProfile")
  .addConditionalEdges(
    afterMutateProfile.from,
    afterMutateProfile.selectAfterMutateProfile,
    withErrorHandlerDrawingPath(
      "mutateProfile",
      afterMutateProfile.paths,
    ),
  )
  .addEdge("runProfileTools", "mutateProfile")
  .compile();
