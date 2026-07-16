/** 改稿子图：执行改稿 → 更新 preview → 清空 revision → 回复感友 */
import { END, START, StateGraph } from "@langchain/langgraph";

import {
  LLM_TIMEOUT_MS,
  llmNodePolicy,
} from "#agent/llm/invoke/timeout.js";
import { AgentState } from "#agent/state.js";

import {
  asNodeErrorHandler,
  withErrorHandlerDrawingPath,
} from "../../helpers/as-node-error-handler.js";
import {
  applyRevisionErrorHandler,
  applyRevisionNode,
} from "./nodes/apply-revision/node.js";
import { finalizeRevisionNode } from "./nodes/finalize-revision/node.js";

const workflow = new StateGraph(AgentState)
  .addNode("applyRevision", applyRevisionNode, {
    ...llmNodePolicy(LLM_TIMEOUT_MS.production),
    errorHandler: asNodeErrorHandler(applyRevisionErrorHandler),
  })
  .addNode("finalizeRevision", finalizeRevisionNode)
  .addEdge(START, "applyRevision")
  .addConditionalEdges(
    "applyRevision",
    () => "finalizeRevision",
    withErrorHandlerDrawingPath("applyRevision", {
      finalizeRevision: "finalizeRevision",
    } as const),
  )
  .addEdge("finalizeRevision", END);

export const reviseGraph = workflow.compile();
