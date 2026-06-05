/** tool-node 绑定的 tool 定义（禁止内部调 LLM） */
import { addPlanTask } from "./add-plan-task.js";
import { completeExecution } from "./complete-execution.js";
import { generateDraft } from "./generate-draft.js";
import { reviseProductionPlan } from "./revise-production-plan.js";
import { spawnSpecialist } from "./spawn-specialist.js";

export const PRODUCTION_TOOLS = [
  addPlanTask,
  completeExecution,
  generateDraft,
  spawnSpecialist,
  reviseProductionPlan,
];
