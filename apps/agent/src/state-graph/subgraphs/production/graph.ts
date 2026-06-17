/**
 * 制作子图：计划 → 分发 → 执行 → 验收 → 流转 →（整理 | 总结）
 *
 * routeProduction 为空节点，仅作 acceptTask / dispatchTask 之后的流转锚点。
 */
import { END, START, StateGraph } from "@langchain/langgraph";

import { AgentState } from "#agent/state.js";

import * as afterDispatchTask from "./conditional-edges/after-dispatch-task.js";
import * as afterRouteProduction from "./conditional-edges/after-route-production.js";
import { acceptTaskNode } from "./nodes/accept-task/node.js";
import { assemblePreviewNode } from "./nodes/assemble-preview/node.js";
import { dispatchTaskNode } from "./nodes/dispatch-task/node.js";
import { executeDesignNode } from "./nodes/execute-design/node.js";
import { executeWritingNode } from "./nodes/execute-writing/node.js";
import { planProductionNode } from "./nodes/plan-production/node.js";
import { renderDesignImageNode } from "./nodes/render-design-image/node.js";
import { routeProductionNode } from "./nodes/route-production/node.js";
import { summarizeProductionNode } from "./nodes/summarize-production/node.js";

export const productionGraph = new StateGraph(AgentState)
  .addNode("planProduction", planProductionNode)
  .addNode("dispatchTask", dispatchTaskNode)
  .addNode("executeWriting", executeWritingNode)
  .addNode("executeDesign", executeDesignNode)
  .addNode("renderDesignImage", renderDesignImageNode)
  .addNode("acceptTask", acceptTaskNode)
  .addNode("routeProduction", routeProductionNode)
  .addNode("assemblePreview", assemblePreviewNode)
  .addNode("summarizeProduction", summarizeProductionNode)
  .addEdge(START, "planProduction")
  .addEdge("planProduction", "dispatchTask")
  .addConditionalEdges(
    afterDispatchTask.from,
    afterDispatchTask.selectAfterDispatchTask,
    afterDispatchTask.paths,
  )
  .addEdge("executeWriting", "acceptTask")
  .addEdge("executeDesign", "renderDesignImage")
  .addEdge("renderDesignImage", "acceptTask")
  .addEdge("acceptTask", "routeProduction")
  .addConditionalEdges(
    afterRouteProduction.from,
    afterRouteProduction.selectAfterRouteProduction,
    afterRouteProduction.paths,
  )
  .addEdge("assemblePreview", "summarizeProduction")
  .addEdge("summarizeProduction", END)
  .compile();
