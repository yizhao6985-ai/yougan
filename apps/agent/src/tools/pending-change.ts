/**
 * 跨模式共享：向 outline.pending_changes 追加条目。
 *
 * - 灵感模式：拒绝（应使用 confirm_requirement）
 * - 大纲模式：若已定稿又新增，自动 outline_ready=false
 * - 创作模式：用户新需求先入 pending，再 generate_content 消费
 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { newOutlineChange } from "../schemas.js";
import { parseMode, parseOutline } from "../state.js";
import { getState, toolCommand } from "./common.js";

/** 大纲 / 创作模式共用：写入待执行或大纲条目。 */
export const addPendingChange = tool(
  async ({ description }, config) => {
    const mode = parseMode(getState());
    if (mode === "inspiration") {
      return toolCommand(
        config,
        "灵感模式不写入大纲条目。请用 confirm_requirement 记录已确认需求，或切换到大纲模式。",
      );
    }
    const trimmed = description.trim();
    if (!trimmed) return toolCommand(config, "变更描述不能为空。");

    const outline = parseOutline(getState());
    const pending = [...outline.pending_changes, newOutlineChange(trimmed)];
    const outlinePatch =
      mode === "outline" && outline.outline_ready
        ? { outline_ready: false, outline_summary: null }
        : {};

    return toolCommand(
      config,
      `已添加大纲条目（共 ${pending.length} 条）。`,
      {
        outline: { ...outline, pending_changes: pending, ...outlinePatch },
      },
    );
  },
  {
    name: "add_pending_change",
    description:
      "添加一条创作大纲条目。大纲模式用于撰写创作大纲；创作模式用于按大纲执行前合并最新修改需求。",
    schema: z.object({
      description: z.string().describe("大纲条目描述"),
    }),
  },
);
