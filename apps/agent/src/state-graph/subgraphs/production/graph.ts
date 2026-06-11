import { START, StateGraph } from "@langchain/langgraph";

import { AgentState } from "#agent/state.js";

import * as afterDirectDesign from "./conditional-edges/after-direct-design.js";
import * as afterDirectWriting from "./conditional-edges/after-direct-writing.js";
import * as afterInspectDeliverable from "./conditional-edges/after-inspect-deliverable.js";
import * as afterRunProductionTools from "./conditional-edges/after-run-production-tools.js";
import * as afterSchedulePlan from "./conditional-edges/after-schedule-plan.js";
import { directDesignNode } from "./nodes/direct-design/node.js";
import { directWritingNode } from "./nodes/direct-writing/node.js";
import { generateDraftNode } from "./nodes/generate-draft/node.js";
import { inspectDeliverableNode } from "./nodes/inspect-deliverable/node.js";
import { schedulePlanNode } from "./nodes/schedule-plan/node.js";
import { spawnSpecialistNode } from "./nodes/spawn-specialist/node.js";
import { runProductionToolsNode } from "./nodes/run-production-tools/node.js";

export const productionGraph = new StateGraph(AgentState)
  .addNode("schedulePlan", schedulePlanNode)
  .addNode("directWriting", directWritingNode)
  .addNode("directDesign", directDesignNode)
  .addNode("runProductionTools", runProductionToolsNode)
  .addNode("generateDraft", generateDraftNode)
  .addNode("spawnSpecialist", spawnSpecialistNode)
  .addNode("inspectDeliverable", inspectDeliverableNode)
  .addEdge(START, "schedulePlan")
  .addConditionalEdges(
    afterSchedulePlan.from,
    afterSchedulePlan.selectAfterSchedulePlan,
    afterSchedulePlan.paths,
  )
  .addConditionalEdges(
    afterDirectWriting.from,
    afterDirectWriting.selectAfterDirectWriting,
    afterDirectWriting.paths,
  )
  .addConditionalEdges(
    afterDirectDesign.from,
    afterDirectDesign.selectAfterDirectDesign,
    afterDirectDesign.paths,
  )
  .addConditionalEdges(
    afterRunProductionTools.from,
    afterRunProductionTools.selectAfterRunProductionTools,
    afterRunProductionTools.paths,
  )
  .addEdge("generateDraft", "inspectDeliverable")
  .addEdge("spawnSpecialist", "inspectDeliverable")
  .addConditionalEdges(
    afterInspectDeliverable.from,
    afterInspectDeliverable.selectAfterInspectDeliverable,
    afterInspectDeliverable.paths,
  )
  .compile();
