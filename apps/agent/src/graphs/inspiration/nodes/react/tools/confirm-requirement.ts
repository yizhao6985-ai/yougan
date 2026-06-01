import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { newConfirmedRequirement } from "../../../../../schema.js";
import { parseInspiration, parseMode } from "../../../../../lib/parse-agent-state.js";
import { getState } from "../../../../../lib/tool-state.js";
import { toolCommand } from "../../../../../lib/tool-command.js";

export const confirmRequirement = tool(
  async ({ description }, config) => {
    if (parseMode(getState()) !== "inspiration") {
      return toolCommand(config, "confirm_requirement 仅在灵感模式可用。");
    }
    const trimmed = description.trim();
    if (!trimmed) return toolCommand(config, "需求描述不能为空。");

    const inspiration = parseInspiration(getState());
    const exists = inspiration.confirmed_requirements.some(
      (item) => item.description.trim() === trimmed,
    );
    if (exists) {
      return toolCommand(
        config,
        `该需求已记录（共 ${inspiration.confirmed_requirements.length} 条）。`,
        { inspiration },
      );
    }

    const confirmed = [
      ...inspiration.confirmed_requirements,
      newConfirmedRequirement(trimmed),
    ];
    return toolCommand(config, `已补充灵感（共 ${confirmed.length} 条）。`, {
      inspiration: {
        ...inspiration,
        confirmed_requirements: confirmed,
      },
    });
  },
  {
    name: "confirm_requirement",
    description:
      "用户明确确认或定稿一条应写入创作脉络的灵感时调用。普通闲聊、试探性回答、尚未敲定的探索性回复不要调用。仅在灵感模式使用。",
    schema: z.object({
      description: z.string().describe("用户已确认或补充的灵感描述"),
    }),
  },
);
