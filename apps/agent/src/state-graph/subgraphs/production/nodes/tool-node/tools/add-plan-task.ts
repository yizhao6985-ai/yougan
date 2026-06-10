/** 将用户本条诉求追加为 productionPlan 待执行任务 */
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { z } from "zod";

import type { ProductionDepartment } from "@yougan/domain";
import { newProductionPlanTask } from "../../schedule-production/helpers/plan-tasks.js";
import {
  getActiveTurnKind,
  getProductionPlan,
  getState,
  patchPendingProductionPlan,
} from "#agent/state-io/index.js";

export const addPlanTask = tool(
  async ({ description, department }, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";

    if (getActiveTurnKind(getState()) !== "production") {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "add_plan_task 仅在制作模式可用。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }
    const trimmed = description.trim();
    if (!trimmed) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "任务描述不能为空。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    const state = getState();
    const plan = getProductionPlan(state);
    const dept = department as ProductionDepartment | undefined;
    const pending = [
      ...plan.pending_tasks,
      newProductionPlanTask(trimmed, dept),
    ];

    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: `已添加制作任务（共 ${pending.length} 项）。`,
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProductionPlan(state, {
          ...plan,
          pending_tasks: pending,
        }),
      },
    });
  },
  {
    name: "add_plan_task",
    description:
      "将感友本条诉求追加为内部待执行任务（不对用户展示）。每次感友发消息须先调用，再执行 generate_draft 或 spawn_specialist。",
    schema: z.object({
      description: z
        .string()
        .describe("任务描述，概括感友本轮诉求"),
      department: z
        .enum(["writing", "design", "audio", "video"])
        .optional()
        .describe(
          "负责部门：writing=文案，design=配图/封面，audio=口播/音频，video=分镜/视频",
        ),
    }),
  },
);
