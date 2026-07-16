/** 收集改稿意见：解析用户消息并写入 revision 清单 */
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
  collectRevisionErrorHandler,
  collectRevisionNode,
} from "./nodes/collect-revision/node.js";

const workflow = new StateGraph(AgentState)
  .addNode("collectRevision", collectRevisionNode, {
    ...llmNodePolicy(LLM_TIMEOUT_MS.structured),
    errorHandler: asNodeErrorHandler(collectRevisionErrorHandler),
  })
  .addEdge(START, "collectRevision")
  .addConditionalEdges(
    "collectRevision",
    () => END,
    withErrorHandlerDrawingPath("collectRevision", {
      __end__: END,
    } as const),
  );

export const collectRevisionGraph = workflow.compile();
