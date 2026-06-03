/**
 * 创作模式 Tool 节点。
 */
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { addPlanTask } from "./nodes/add-plan-task.js";
import { updateWorkProfile } from "#agent/tools/profile.js"
import { REFERENCE_TOOLS } from "#agent/tools/references.js"

import { completeExecution } from "./nodes/complete-execution.js";
import { generateDraft } from "./nodes/generate-draft.js";
import { reviseProductionPlan } from "./nodes/revise-production-plan.js";
import { spawnSpecialist } from "./nodes/spawn-specialist.js";

export const CREATION_TOOLS = [
  addPlanTask,
  completeExecution,
  updateWorkProfile,
  generateDraft,
  spawnSpecialist,
  reviseProductionPlan,
  ...REFERENCE_TOOLS,
];

export const toolNode = new ToolNode(CREATION_TOOLS);
