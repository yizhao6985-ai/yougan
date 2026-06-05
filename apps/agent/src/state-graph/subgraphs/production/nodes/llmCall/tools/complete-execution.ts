/** 标记当前任务完成并出队 pending_tasks */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import {
  parseActiveTurnKind,
  parseProductionPlan,
} from "#agent/runtime/state-readers.js";
import { patchStagingProductionPlan } from "#agent/runtime/staging-writes.js";
import { getState } from "#agent/runtime/tool-context.js";
import { toolCommand } from "#agent/runtime/tool-context.js";

export const completeExecution = tool(
  async ({ summary }, config) => {
    if (parseActiveTurnKind(getState()) !== "production") {
      return toolCommand(config, "complete_execution 仅在制作模式可用。");
    }
    const trimmed = summary.trim();
    if (!trimmed) return toolCommand(config, "执行摘要不能为空。");

    const state = getState();
    const plan = parseProductionPlan(state);
    if (!plan.pending_tasks.length) {
      return toolCommand(config, "当前没有待执行任务，无需完成执行。");
    }

    const executedAt = new Date().toISOString();
    const executed = [
      ...plan.executed_tasks,
      ...plan.pending_tasks.map((change) => ({
        id: change.id,
        description: change.description,
        executed_at: executedAt,
        batch_summary: trimmed,
        department: change.department,
        assignee: change.assignee ?? null,
      })),
    ];
    const count = plan.pending_tasks.length;

    return toolCommand(
      config,
      `执行完成，已合并 ${count} 项任务。摘要：${trimmed}`,
      patchStagingProductionPlan(state, {
        ...plan,
        pending_tasks: [],
        executed_tasks: executed,
        last_execution_summary: trimmed,
      }),
    );
  },
  {
    name: "complete_execution",
    description:
      "制作团队执行完成后调用：将待执行任务合并进已完成记录，记录执行摘要。",
    schema: z.object({
      summary: z.string().describe("本次执行的修改点摘要"),
    }),
  },
);
