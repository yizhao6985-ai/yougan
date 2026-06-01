/**
 * 向制作计划 pending_changes 追加任务条目。
 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import {
  isPlanReady,
  newProductionPlanTask,
  type ProductionDepartment,
} from "../schema.js";
import { parseMode, parseProductionPlan } from "../lib/parse-agent-state.js";
import { getState } from "../lib/tool-state.js";
import { toolCommand } from "../lib/tool-command.js";

export const addPendingChange = tool(
  async ({ description, department }, config) => {
    const mode = parseMode(getState());
    if (mode === "inspiration" || mode === "ask") {
      return toolCommand(
        config,
        "灵感/提问模式不写入制作计划。请用 confirm_requirement 记录需求，或切换到创作模式。",
      );
    }
    const trimmed = description.trim();
    if (!trimmed) return toolCommand(config, "任务描述不能为空。");

    const plan = parseProductionPlan(getState());
    const dept = department as ProductionDepartment | undefined;
    const pending = [
      ...plan.pending_changes,
      newProductionPlanTask(trimmed, dept),
    ];
    const planPatch =
      mode === "creation" && isPlanReady(plan)
        ? {}
        : {};

    return toolCommand(
      config,
      `已添加制作任务（共 ${pending.length} 项）。`,
      {
        plan: { ...plan, pending_changes: pending, ...planPatch },
      },
    );
  },
  {
    name: "add_pending_change",
    description:
      "添加一条制作计划任务。创作模式中客户提出新需求时调用，可指定 department。",
    schema: z.object({
      description: z.string().describe("任务描述"),
      department: z
        .enum(["writing", "design", "audio", "video"])
        .optional()
        .describe("负责部门，默认 writing"),
    }),
  },
);
