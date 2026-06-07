/** 标记当前任务完成并出队 pending_tasks */
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { z } from "zod";

import {
  getActiveTurnKind,
  getPreview,
  getProductionPlan,
  getState,
  patchPendingProductionPlan,
} from "#agent/state-io/index.js";

import {
  formatMissingDeliverableMessage,
  missingDeliverableDepartments,
} from "../../../helpers/deliverable.js";

export const completeExecution = tool(
  async ({ summary }, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";

    if (getActiveTurnKind(getState()) !== "production") {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "complete_execution 仅在制作模式可用。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }
    const trimmed = summary.trim();
    if (!trimmed) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "执行摘要不能为空。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    const state = getState();
    const plan = getProductionPlan(state);
    const preview = getPreview(state);
    const missing = missingDeliverableDepartments(preview, plan.pending_tasks);
    if (missing.length) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: formatMissingDeliverableMessage(missing),
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    if (!plan.pending_tasks.length) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "当前没有待执行任务，无需完成执行。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
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

    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: `执行完成，已合并 ${count} 项任务。摘要：${trimmed}`,
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProductionPlan(state, {
          ...plan,
          pending_tasks: [],
          executed_tasks: executed,
          last_execution_summary: trimmed,
        }),
      },
    });
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
