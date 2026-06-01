/**
 * 创作模式工具：制作团队按创意总监计划执行。
 */
import { addPendingChange } from "../../../../../tools/pending-change.js";
import { switchMode } from "../../../../../tools/mode.js";
import { updateWorkProfile } from "../../../../../tools/profile.js";
import { REFERENCE_TOOLS } from "../../../../../tools/references.js";

import { completeExecution } from "./complete-execution.js";
import { generateContent } from "./generate-content.js";
import { reviseProductionPlan } from "./revise-production-plan.js";
import { spawnSpecialist } from "./spawn-specialist.js";

export const CREATION_TOOLS = [
  switchMode,
  addPendingChange,
  completeExecution,
  updateWorkProfile,
  generateContent,
  spawnSpecialist,
  reviseProductionPlan,
  ...REFERENCE_TOOLS,
];
