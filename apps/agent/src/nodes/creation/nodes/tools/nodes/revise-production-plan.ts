import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { parseActiveTurnKind } from "#agent/lib/parse-agent-state.js"
import { getState } from "#agent/lib/tool-state.js"
import { toolCommand } from "#agent/lib/tool-command.js"
import { runCreativeDirector } from "../../creative-director/logic.js";

export const reviseProductionPlan = tool(
  async ({ reason }, config) => {
    if (parseActiveTurnKind(getState()) !== "creation") {
      return toolCommand(config, "revise_production_plan 仅在创作模式可用。");
    }

    const state = getState();
    const patch = await runCreativeDirector(state, { force: true });

    return toolCommand(
      config,
      `创意总监已根据「${reason.trim() || "新要求"}」重新制定创作计划。`,
      patch,
    );
  },
  {
    name: "revise_production_plan",
    description: "调整整体制作方向时，由创意总监重新制定内部创作计划。",
    schema: z.object({
      reason: z.string().describe("调整原因或新要求摘要"),
    }),
  },
);
