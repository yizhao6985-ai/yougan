/**
 * 三模式切换工具。
 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import type { ChatMode } from "../schema.js";
import { CHAT_MODE_LABELS } from "../schema.js";
import { parseMode } from "../lib/parse-agent-state.js";
import { getState } from "../lib/tool-state.js";
import { toolCommand } from "../lib/tool-command.js";

export const switchMode = tool(
  async ({ mode }, config) => {
    const current = parseMode(getState());
    if (current === mode) {
      return toolCommand(config, `当前已是${CHAT_MODE_LABELS[mode]}。`);
    }

    return toolCommand(config, `已切换到${CHAT_MODE_LABELS[mode]}。`, { mode });
  },
  {
    name: "switch_mode",
    description:
      "切换作品的创作模式。用户明确要求切换时调用；用户同意你建议的模式切换时也应调用。",
    schema: z.object({
      mode: z
        .enum(["inspiration", "creation", "ask"])
        .describe("目标模式：inspiration=灵感，creation=创作，ask=提问"),
    }),
  },
);
