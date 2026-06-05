import { ToolNode } from "@langchain/langgraph/prebuilt";

import { addPlanTask } from "./nodes/add-plan-task.js";
import { completeExecution } from "./nodes/complete-execution.js";
import { generateDraft } from "./nodes/generate-draft.js";
import { reviseProductionPlan } from "./nodes/revise-production-plan.js";
import { spawnSpecialist } from "./nodes/spawn-specialist.js";

export const PRODUCTION_TOOLS = [
  addPlanTask,
  completeExecution,
  generateDraft,
  spawnSpecialist,
  reviseProductionPlan,
];

export const toolNode = new ToolNode(PRODUCTION_TOOLS);
