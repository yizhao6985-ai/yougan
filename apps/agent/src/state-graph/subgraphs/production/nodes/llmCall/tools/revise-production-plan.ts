/** 整体方向变化时重做制作计划 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { parseActiveTurnKind } from "#agent/runtime/state-readers.js";
import { getState } from "#agent/runtime/tool-context.js";
import { toolCommand } from "#agent/runtime/tool-context.js";
import { rescheduleProductionPlan } from "../../scheduleProduction/node.js";

export const reviseProductionPlan = tool(
  async ({ reason }, config) => {
    if (parseActiveTurnKind(getState()) !== "production") {
      return toolCommand(config, "revise_production_plan 仅在制作模式可用。");
    }

    const state = getState();
    const patch = await rescheduleProductionPlan(state, { force: true });

    return toolCommand(
      config,
      `制作总监已根据「${reason.trim() || "新要求"}」重新制定创作计划。`,
      patch,
    );
  },
  {
    name: "revise_production_plan",
    description: "调整整体制作方向时，由制作总监重新制定内部创作计划。",
    schema: z.object({
      reason: z.string().describe("调整原因或新要求摘要"),
    }),
  },
);
