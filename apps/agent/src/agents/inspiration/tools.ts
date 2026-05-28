/**
 * 灵感模式专属工具：CRUD + 参考素材。
 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { findRequirementIndex } from "../../lib/inspiration-merge.js";
import {
  EMPTY_WORK_INSPIRATION,
  newConfirmedRequirement,
} from "../../schemas.js";
import { parseInspiration, parseMode } from "./state.js";
import { switchMode } from "../../tools/mode.js";
import { REFERENCE_TOOLS } from "../../tools/references.js";
import { getState, toolCommand } from "../../tools/common.js";

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

export const INSPIRATION_TOOLS = [
  switchMode,
  confirmRequirement,
  updateRequirement,
  deleteRequirement,
  clearInspirations,
  ...REFERENCE_TOOLS,
];
