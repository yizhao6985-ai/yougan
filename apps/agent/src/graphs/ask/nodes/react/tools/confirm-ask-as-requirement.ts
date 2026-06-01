import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { newConfirmedRequirement } from "../../../../../schema.js";
import {
  parseInspiration,
  parseMode,
} from "../../../../../lib/parse-agent-state.js";
import { getState } from "../../../../../lib/tool-state.js";
import { toolCommand } from "../../../../../lib/tool-command.js";

export const confirmAskAsRequirement = tool(
  async ({ description }, config) => {
    if (parseMode(getState()) !== "ask") {
      return toolCommand(
        config,
        "confirm_ask_as_requirement 仅在提问模式可用。",
      );
    }
    const trimmed = description.trim();
    if (!trimmed) return toolCommand(config, "描述不能为空。");

    const inspiration = parseInspiration(getState());
    const exists = inspiration.confirmed_requirements.some(
      (item) => item.description.trim() === trimmed,
    );
    if (exists) {
      return toolCommand(config, "该需求已存在于灵感列表中。", { inspiration });
    }

    const confirmed = [
      ...inspiration.confirmed_requirements,
      newConfirmedRequirement(trimmed),
    ];
    return toolCommand(
      config,
      `已将问答结论记入灵感（共 ${confirmed.length} 条）。`,
      {
        inspiration: { ...inspiration, confirmed_requirements: confirmed },
      },
    );
  },
  {
    name: "confirm_ask_as_requirement",
    description: "客户明确要求将某条问答结论记入灵感时调用。普通问答不要调用。",
    schema: z.object({
      description: z.string().describe("要记入灵感的结论描述"),
    }),
  },
);
