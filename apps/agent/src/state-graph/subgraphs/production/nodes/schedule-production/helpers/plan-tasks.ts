import { nanoid } from "nanoid";

import type {
  ProductionDepartment,
  ProductionPlanTask,
} from "@yougan/domain";

export function newProductionPlanTask(
  description: string,
  department?: ProductionDepartment,
): ProductionPlanTask {
  return {
    id: nanoid(12),
    description,
    created_at: new Date().toISOString(),
    department,
    status: "pending",
  };
}
