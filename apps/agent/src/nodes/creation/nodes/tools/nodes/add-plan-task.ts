/**
 * 向内部创作计划 pending_tasks 追加任务。
 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import {
  newProductionPlanTask,
  type ProductionDepartment,
} from "#agent/schema.js";
import {
  parseActiveTurnKind,
  parseProductionPlan,
} from "#agent/lib/parse-agent-state.js";
import { getState } from "#agent/lib/tool-state.js"
import { toolCommand } from "#agent/lib/tool-command.js"

export const addPlanTask = tool(
  async ({ description, department }, config) => {
    if (parseActiveTurnKind(getState()) !== "creation") {
      return toolCommand(config, "add_plan_task 仅在创作模式可用。");
    }
    const trimmed = description.trim();
    if (!trimmed) return toolCommand(config, "任务描述不能为空。");

    const plan = parseProductionPlan(getState());
    const dept = department as ProductionDepartment | undefined;
    const pending = [...plan.pending_tasks, newProductionPlanTask(trimmed, dept)];

    return toolCommand(config, `已添加制作任务（共 ${pending.length} 项）。`, {
      plan: { ...plan, pending_tasks: pending },
    });
  },
  {
    name: "add_plan_task",
    description: "向内部创作计划追加任务（不对用户展示）。",
    schema: z.object({
      description: z.string().describe("任务描述"),
      department: z
        .enum(["writing", "design", "audio", "video"])
        .optional()
        .describe("负责部门"),
    }),
  },
);
