/**
 * 创作模式 Tool 节点。
 */
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { addPlanTask } from "../../../tools/plan-task.js";
import { switchMode } from "../../../tools/mode.js";
import { updateWorkProfile } from "../../../tools/profile.js";
import { REFERENCE_TOOLS } from "../../../tools/references.js";

import { completeExecution } from "./complete-execution.js";
import { generateDraft } from "./generate-draft.js";
import { reviseProductionPlan } from "./revise-production-plan.js";
import { spawnSpecialist } from "./spawn-specialist.js";

export const CREATION_TOOLS = [
  switchMode,
  addPlanTask,
  completeExecution,
  updateWorkProfile,
  generateDraft,
  spawnSpecialist,
  reviseProductionPlan,
  ...REFERENCE_TOOLS,
];

export const toolNode = new ToolNode(CREATION_TOOLS);
