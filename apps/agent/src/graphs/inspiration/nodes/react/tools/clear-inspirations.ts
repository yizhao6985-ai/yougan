import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { EMPTY_WORK_INSPIRATION } from "../../../../../schema.js";
import { parseMode } from "../../../../../lib/parse-agent-state.js";
import { getState } from "../../../../../lib/tool-state.js";
import { toolCommand } from "../../../../../lib/tool-command.js";

export const clearInspirations = tool(
  async (_input, config) => {
    if (parseMode(getState()) !== "inspiration") {
      return toolCommand(config, "clear_inspirations 仅在灵感模式可用。");
    }

    return toolCommand(config, "已清空全部灵感。", {
      inspiration: { ...EMPTY_WORK_INSPIRATION },
    });
  },
  {
    name: "clear_inspirations",
    description:
      "清空全部已确认灵感。仅在用户明确要求「清空灵感/重新开始」时调用。",
    schema: z.object({}),
  },
);
