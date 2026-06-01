import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { findRequirementIndex } from "../../../../../lib/inspiration-merge.js";
import { parseInspiration, parseMode } from "../../../../../lib/parse-agent-state.js";
import { getState } from "../../../../../lib/tool-state.js";
import { toolCommand } from "../../../../../lib/tool-command.js";

export const updateRequirement = tool(
  async ({ requirement_id, description }, config) => {
    if (parseMode(getState()) !== "inspiration") {
      return toolCommand(config, "update_requirement 仅在灵感模式可用。");
    }
    const trimmed = description.trim();
    if (!trimmed) return toolCommand(config, "灵感描述不能为空。");

    const inspiration = parseInspiration(getState());
    const index = findRequirementIndex(inspiration, requirement_id);
    if (index < 0) {
      return toolCommand(config, "未找到要修改的灵感条目。");
    }

    const nextRequirements = [...inspiration.confirmed_requirements];
    nextRequirements[index] = {
      ...nextRequirements[index],
      description: trimmed,
    };

    return toolCommand(config, "已修改灵感条目。", {
      inspiration: {
        ...inspiration,
        confirmed_requirements: nextRequirements,
      },
    });
  },
  {
    name: "update_requirement",
    description: "修改已有灵感条目。用户要求改某条已确认灵感时调用。",
    schema: z.object({
      requirement_id: z.string().describe("要修改的灵感条目 id"),
      description: z.string().describe("修改后的灵感描述"),
    }),
  },
);
