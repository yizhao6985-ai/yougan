import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { reviseProfileFull } from "#agent/lib/work-profile/revise-full.js";
import { parseActiveTurnKind } from "#agent/lib/parse-agent-state.js";
import { patchStagingProfile } from "#agent/lib/staging-state.js";
import { getState } from "#agent/lib/tool-state.js";
import { toolCommand } from "#agent/lib/tool-command.js";

export const reviseProfile = tool(
  async ({ reason }, config) => {
    const state = getState();
    if (parseActiveTurnKind(state) !== "profile") {
      return toolCommand(config, "revise_profile 仅在 profile 模式可用。");
    }
    const patch = await reviseProfileFull(state, reason);
    if (!patch.profile) {
      return toolCommand(config, "未能重做作品方案，请继续对话细化。");
    }
    return toolCommand(
      config,
      "已根据新要求重做作品方案结构。",
      patchStagingProfile(state, patch.profile),
    );
  },
  {
    name: "revise_profile",
    description: "整体方向变化时，全量重做 premise 与 beats。",
    schema: z.object({
      reason: z.string().describe("调整原因"),
    }),
  },
);
