/** 整体方向变化时重做制作计划 */
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { z } from "zod";

import { getActiveTurnKind, getState } from "#agent/state-io/index.js";

import { rescheduleProductionPlan } from "../../schedule-production/node.js";

export const reviseProductionPlan = tool(
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
    const patch = await rescheduleProductionPlan(state, { force: true });

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
    description: "调整整体制作方向时，由制作总监重新制定内部创作计划。",
    schema: z.object({
      reason: z.string().describe("调整原因或新要求摘要"),
    }),
  },
);
