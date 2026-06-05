import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { reviseBlueprintFull } from "#agent/lib/blueprint/revise-full.js";
import { parseActiveTurnKind } from "#agent/lib/parse-agent-state.js";
import { getState } from "#agent/lib/tool-state.js";
import { toolCommand } from "#agent/lib/tool-command.js";

export const reviseBlueprint = tool(
  async ({ reason }, config) => {
    if (parseActiveTurnKind(getState()) !== "blueprint") {
      return toolCommand(config, "revise_blueprint 仅在 blueprint 模式可用。");
    }
    const patch = await reviseBlueprintFull(getState(), reason);
    if (!patch.blueprint) {
      return toolCommand(config, "未能重做作品方案，请继续对话细化。");
    }
    return toolCommand(config, "已根据新要求重做作品方案结构。", patch);
  },
  {
    name: "revise_blueprint",
    description: "整体方向变化时，全量重做 premise 与 beats。",
    schema: z.object({
      reason: z.string().describe("调整原因"),
    }),
  },
);
