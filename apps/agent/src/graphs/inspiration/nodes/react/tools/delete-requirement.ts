import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { findRequirementIndex } from "../../../../../lib/inspiration-merge.js";
import { parseInspiration, parseMode } from "../../../../../lib/parse-agent-state.js";
import { getState } from "../../../../../lib/tool-state.js";
import { toolCommand } from "../../../../../lib/tool-command.js";

export const deleteRequirement = tool(
  async ({ requirement_id }, config) => {
    if (parseMode(getState()) !== "inspiration") {
      return toolCommand(config, "delete_requirement 仅在灵感模式可用。");
    }

    const inspiration = parseInspiration(getState());
    const index = findRequirementIndex(inspiration, requirement_id);
    if (index < 0) {
      return toolCommand(config, "未找到要删除的灵感条目。");
    }

    const nextRequirements = inspiration.confirmed_requirements.filter(
      (item) => item.id !== requirement_id,
    );

    return toolCommand(
      config,
      `已删除 1 条灵感（剩余 ${nextRequirements.length} 条）。`,
      {
        inspiration: {
          ...inspiration,
          confirmed_requirements: nextRequirements,
        },
      },
    );
  },
  {
    name: "delete_requirement",
    description: "删除一条已确认灵感。用户要求去掉某条灵感时调用。",
    schema: z.object({
      requirement_id: z.string().describe("要删除的灵感条目 id"),
    }),
  },
);
