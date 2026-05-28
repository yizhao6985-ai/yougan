/**
 * 三模式切换工具。
 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import type { ChatMode } from "../schemas.js";
import { parseMode } from "../state.js";
import { getState, toolCommand } from "./common.js";

const MODE_LABELS: Record<ChatMode, string> = {
  inspiration: "灵感模式",
  outline: "大纲模式",
  creation: "创作模式",
};

export const switchMode = tool(
  async ({ mode }, config) => {
    const current = parseMode(getState());
    if (current === mode) {
      return toolCommand(config, `当前已是${MODE_LABELS[mode]}。`);
    }

    return toolCommand(config, `已切换到${MODE_LABELS[mode]}。`, { mode });
  },
  {
    name: "switch_mode",
    description:
      "切换作品的创作模式。用户明确要求切换（如「切换到大纲模式」「进入创作模式」）时调用；用户同意你建议的模式切换时也应调用。",
    schema: z.object({
      mode: z
        .enum(["inspiration", "outline", "creation"])
        .describe("目标模式：inspiration=灵感，outline=大纲，creation=创作"),
    }),
  },
);
