/** production 子图 ToolNode 工具（禁止内部调 LLM） */
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { z } from "zod";

import type { ProductionDepartment } from "@yougan/domain";
import {
  getActiveTurnKind,
  getPreview,
  getProductionPlan,
  getState,
  patchPendingProductionMeta,
  patchPendingProductionPlan,
} from "#agent/state-io/index.js";

import {
  formatMissingDeliverableMessage,
  missingDeliverableDepartments,
} from "../../../helpers/deliverable.js";
import { newPlanTask } from "../../schedule-plan/helpers/new-plan-task.js";
import { reschedulePlan } from "../../schedule-plan/node.js";

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
    const pending = [...plan.pending_tasks, newPlanTask(trimmed, dept)];

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
      description: z.string().describe("任务描述，概括感友本轮诉求"),
      department: z
        .enum(["writing", "design", "audio", "video"])
        .optional()
        .describe(
          "负责部门：writing=文案，design=配图/封面，audio=口播/音频，video=分镜/视频",
        ),
    }),
  },
);

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
      "generate_draft 或 spawn_specialist 执行完成后调用：合并待执行任务并记录摘要。",
    schema: z.object({
      summary: z.string().describe("本次执行的修改点摘要，面向内部记录"),
    }),
  },
);

export const requestGenerateDraft = tool(
  async (_input, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const state = getState();

    if (getActiveTurnKind(state) !== "production") {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "generate_draft 仅在制作模式可用。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: "已提交文案出稿任务，将由文案总监执行。",
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProductionMeta(state, { pendingGenerateDraft: true }),
      },
    });
  },
  {
    name: "generate_draft",
    description:
      "文案管线专用：文案总监根据内部计划生成或更新成稿。须先 add_plan_task；设计/音频/视频请用 spawn_specialist。",
    schema: z.object({}),
  },
);

export const requestSpawnSpecialist = tool(
  async ({ department, brief, specialist_name }, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const state = getState();

    if (getActiveTurnKind(state) !== "production") {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "spawn_specialist 仅在制作模式可用。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: `已提交 ${department} 专员任务，即将执行。`,
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProductionMeta(state, {
          pendingSpawnSpecialist: {
            department,
            brief,
            specialist_name: specialist_name ?? null,
          },
        }),
      },
    });
  },
  {
    name: "spawn_specialist",
    description:
      "委派部门专员执行任务。须先 add_plan_task。writing 请用 generate_draft。",
    schema: z.object({
      department: z
        .enum(["writing", "design", "audio", "video"])
        .describe(
          "部门：design=配图/封面/视觉，audio=口播/音频，video=分镜/视频，writing 勿用",
        ),
      brief: z
        .string()
        .describe("交给专员的具体任务说明，含风格、用途与交付要求"),
      specialist_name: z.string().optional().describe("专员称呼，可省略"),
    }),
  },
);

export const revisePlan = tool(
  async ({ reason }, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";

    if (getActiveTurnKind(getState()) !== "production") {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "revise_production_plan 仅在制作模式可用。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    const state = getState();
    const patch = await reschedulePlan(state, { force: true });

    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: `制作总监已根据「${reason.trim() || "新要求"}」重新制定创作计划。`,
            tool_call_id: toolCallId,
          }),
        ],
        ...patch,
      },
    });
  },
  {
    name: "revise_production_plan",
    description:
      "感友调整整体制作方向时调用，由制作总监重新制定内部创作计划。",
    schema: z.object({
      reason: z.string().describe("调整原因或感友新要求摘要"),
    }),
  },
);
