/**
 * 制作子图：计划 → 分发 → 文案执行 → 验收 → 流转 →（整理 | 结束）
 *
 * routeProduction 为空节点，仅作 acceptTask / dispatchTask 之后的流转锚点。
 */
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
import * as afterDispatchTask from "./conditional-edges/after-dispatch-task.js";
import * as afterRouteProduction from "./conditional-edges/after-route-production.js";
import {
  acceptTaskErrorHandler,
  acceptTaskNode,
} from "./nodes/accept-task/node.js";
import {
  assemblePreviewErrorHandler,
  assemblePreviewNode,
} from "./nodes/assemble-preview/node.js";
import { dispatchTaskNode } from "./nodes/dispatch-task/node.js";
import {
  executeWritingErrorHandler,
  executeWritingNode,
} from "./nodes/execute-writing/node.js";
import {
  planProductionErrorHandler,
  planProductionNode,
} from "./nodes/plan-production/node.js";
import { routeProductionNode } from "./nodes/route-production/node.js";

export const productionGraph = new StateGraph(AgentState)
  .addNode("planProduction", planProductionNode, {
    ...llmNodePolicy(LLM_TIMEOUT_MS.structured),
    errorHandler: asNodeErrorHandler(planProductionErrorHandler),
  })
  .addNode("dispatchTask", dispatchTaskNode)
  .addNode("executeWriting", executeWritingNode, {
    ...llmNodePolicy(LLM_TIMEOUT_MS.production),
    errorHandler: asNodeErrorHandler(executeWritingErrorHandler),
  })
  .addNode("acceptTask", acceptTaskNode, {
    ...llmNodePolicy(LLM_TIMEOUT_MS.structured),
    errorHandler: asNodeErrorHandler(acceptTaskErrorHandler),
  })
  .addNode("routeProduction", routeProductionNode)
  .addNode("assemblePreview", assemblePreviewNode, {
    ...llmNodePolicy(LLM_TIMEOUT_MS.production),
    errorHandler: asNodeErrorHandler(assemblePreviewErrorHandler),
  })
  .addEdge(START, "planProduction")
  .addConditionalEdges(
    "planProduction",
    () => "dispatchTask",
    withErrorHandlerDrawingPath("planProduction", {
      dispatchTask: "dispatchTask",
    } as const),
  )
  .addConditionalEdges(
    afterDispatchTask.from,
    afterDispatchTask.selectAfterDispatchTask,
    withErrorHandlerDrawingPath("executeWriting", afterDispatchTask.paths),
  )
  .addConditionalEdges(
    "executeWriting",
    () => "acceptTask",
    withErrorHandlerDrawingPath("acceptTask", {
      acceptTask: "acceptTask",
    } as const),
  )
  .addEdge("acceptTask", "routeProduction")
  .addConditionalEdges(
    afterRouteProduction.from,
    afterRouteProduction.selectAfterRouteProduction,
    withErrorHandlerDrawingPath(
      "assemblePreview",
      afterRouteProduction.paths,
    ),
  )
  .addEdge("assemblePreview", END)
  .compile();
