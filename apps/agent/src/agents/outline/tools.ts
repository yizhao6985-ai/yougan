/** 大纲模式工具：同步灵感、撰写/定稿大纲、更新 profile、参考素材 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { parseMode, parseOutline } from "./state.js";
import { addPendingChange } from "../../tools/pending-change.js";
import { switchMode } from "../../tools/mode.js";
import { updateWorkProfile } from "../../tools/profile.js";
import { REFERENCE_TOOLS } from "../../tools/references.js";
import { getState, toolCommand } from "../../tools/common.js";
import { syncOutlineFromInspiration } from "./sync-from-inspiration.js";

export const syncOutlineFromInspirationTool = tool(
  async (_input, config) => {
    if (parseMode(getState()) !== "outline") {
      return toolCommand(config, "sync_outline_from_inspiration 仅在大纲模式可用。");
    }

    try {
      const outline = await syncOutlineFromInspiration(getState());
      const implemented = outline.executed_changes.length;
      const pending = outline.pending_changes.length;
      return toolCommand(
        config,
        `已根据灵感同步大纲：已实现 ${implemented} 条，待实现 ${pending} 条。`,
        { outline },
      );
    } catch {
      return toolCommand(config, "大纲同步失败，请稍后重试。");
    }
  },
  {
    name: "sync_outline_from_inspiration",
    description:
      "根据灵感与当前作品产出同步大纲：有作品时对照已实现/待实现；无作品时从灵感生成大纲条目。",
    schema: z.object({}),
  },
);

export const completeOutline = tool(
  async ({ summary }, config) => {
    if (parseMode(getState()) !== "outline") {
      return toolCommand(config, "complete_outline 仅在大纲模式可用。");
    }
    const trimmed = summary.trim();
    if (!trimmed) return toolCommand(config, "大纲摘要不能为空。");

    const outline = parseOutline(getState());
    if (!outline.pending_changes.length) {
      return toolCommand(
        config,
        "当前还没有大纲条目，请先添加至少一条大纲内容后再定稿。",
      );
    }

    return toolCommand(
      config,
      `创作大纲已定稿（共 ${outline.pending_changes.length} 条）。`,
      {
        outline: {
          ...outline,
          outline_ready: true,
          outline_summary: trimmed,
        },
      },
    );
  },
  {
    name: "complete_outline",
    description:
      "大纲模式定稿：用户确认没有更多补充后调用，标记创作大纲已完成。定稿后才可引导切换到创作模式按大纲出稿。",
    schema: z.object({
      summary: z.string().describe("整份创作大纲的摘要"),
    }),
  },
);

export const OUTLINE_TOOLS = [
  switchMode,
  syncOutlineFromInspirationTool,
  addPendingChange,
  completeOutline,
  updateWorkProfile,
  ...REFERENCE_TOOLS,
];
