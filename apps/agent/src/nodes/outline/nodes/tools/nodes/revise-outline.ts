import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { parseActiveTurnKind } from "#agent/lib/parse-agent-state.js"
import { reviseOutlineFull } from "#agent/lib/outline/revise-full.js"
import { getState } from "#agent/lib/tool-state.js"
import { toolCommand } from "#agent/lib/tool-command.js"

export const reviseOutline = tool(
  async ({ reason }, config) => {
    if (parseActiveTurnKind(getState()) !== "outline") {
      return toolCommand(config, "revise_outline 仅在大纲模式可用。");
    }

    const patch = await reviseOutlineFull(getState(), reason);
    if (!patch.outline) {
      return toolCommand(config, "大纲重新生成失败，请稍后重试。");
    }

    return toolCommand(
      config,
      `已根据「${reason.trim() || "新要求"}」重新制定大纲。`,
      patch,
    );
  },
  {
    name: "revise_outline",
    description: "用户要求调整整体内容方向时，重新制定大纲。",
    schema: z.object({
      reason: z.string().describe("调整原因或用户新要求摘要"),
    }),
  },
);
