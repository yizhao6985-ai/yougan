/** 整体方向变化时重做制作计划 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { getActiveTurnKind, getState } from "#agent/state-io/index.js";

import { commandWithUpdate } from "../command-with-update.js";
import { rescheduleProductionPlan } from "../../schedule-production/node.js";

export const reviseProductionPlan = tool(
  async ({ reason }, config) => {
    if (getActiveTurnKind(getState()) !== "production") {
      return commandWithUpdate(config, "revise_production_plan 仅在制作模式可用。");
    }

    const state = getState();
    const patch = await rescheduleProductionPlan(state, { force: true });

    return commandWithUpdate(
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
