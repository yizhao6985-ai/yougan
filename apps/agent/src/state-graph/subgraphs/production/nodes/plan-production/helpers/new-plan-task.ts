import { nanoid } from "nanoid";

import type {
  ProductionDepartment,
  ProductionTask,
} from "@yougan/domain";

import { defaultTaskGuidance } from "../../../helpers/task-plan.js";

export function newPlanTask(
  description: string,
  department?: ProductionDepartment,
  guidance?: {
    direction?: string | null;
    acceptance_criteria?: string | null;
  },
): ProductionTask {
  const defaults = defaultTaskGuidance(description);
  return {
    id: nanoid(12),
    description,
    created_at: new Date().toISOString(),
    department,
    status: "pending",
    direction: guidance?.direction?.trim() || defaults.direction,
    acceptance_criteria:
      guidance?.acceptance_criteria?.trim() || defaults.acceptance_criteria,
    feedback: null,
    deliverable: null,
    accept_retry_count: 0,
    failure_message: null,
  };
}
