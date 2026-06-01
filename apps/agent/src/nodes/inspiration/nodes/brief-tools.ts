import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { findBriefRequirementIndex, newBriefRequirement } from "@yougan/domain";
import { parseBrief, parseMode } from "../../../lib/parse-agent-state.js";
import { getState } from "../../../lib/tool-state.js";
import { toolCommand } from "../../../lib/tool-command.js";

export const addBriefRequirement = tool(
  async ({ description }, config) => {
    if (parseMode(getState()) !== "inspiration") {
      return toolCommand(config, "add_brief_requirement 仅在灵感模式可用。");
    }
    const trimmed = description.trim();
    if (!trimmed) return toolCommand(config, "需求描述不能为空。");

    const brief = parseBrief(getState());
    const exists = brief.requirements.some(
      (item) => item.description.trim() === trimmed,
    );
    if (exists) {
      return toolCommand(config, "该需求已在 brief 中。");
    }

    const next = [...brief.requirements, newBriefRequirement(trimmed)];

    return toolCommand(config, `已确认 brief 需求（共 ${next.length} 条）。`, {
      brief: { ...brief, requirements: next },
    });
  },
  {
    name: "add_brief_requirement",
    description: "将客户明确认可的一条需求写入 brief。客户确认后再调用，不要自动写入探索性对话。",
    schema: z.object({
      description: z.string().describe("已确认的需求描述"),
    }),
  },
);

export const updateBriefRequirement = tool(
  async ({ requirement_id, description }, config) => {
    if (parseMode(getState()) !== "inspiration") {
      return toolCommand(config, "update_brief_requirement 仅在灵感模式可用。");
    }
    const trimmed = description.trim();
    if (!trimmed) return toolCommand(config, "需求描述不能为空。");

    const brief = parseBrief(getState());
    const index = findBriefRequirementIndex(brief, requirement_id);
    if (index < 0) {
      return toolCommand(config, `未找到需求 ${requirement_id}。`);
    }

    const nextRequirements = [...brief.requirements];
    nextRequirements[index] = {
      ...nextRequirements[index]!,
      description: trimmed,
    };

    return toolCommand(config, "已更新 brief 需求。", {
      brief: { ...brief, requirements: nextRequirements },
    });
  },
  {
    name: "update_brief_requirement",
    description: "修改 brief 中已有需求的描述。",
    schema: z.object({
      requirement_id: z.string(),
      description: z.string(),
    }),
  },
);

export const deleteBriefRequirement = tool(
  async ({ requirement_id }, config) => {
    if (parseMode(getState()) !== "inspiration") {
      return toolCommand(config, "delete_brief_requirement 仅在灵感模式可用。");
    }

    const brief = parseBrief(getState());
    const index = findBriefRequirementIndex(brief, requirement_id);
    if (index < 0) {
      return toolCommand(config, `未找到需求 ${requirement_id}。`);
    }

    const nextRequirements = brief.requirements.filter(
      (item) => item.id !== requirement_id,
    );

    return toolCommand(
      config,
      "已删除 brief 需求。",
      {
        brief: {
          ...brief,
          requirements: nextRequirements,
          ready: nextRequirements.length ? brief.ready : false,
        },
      },
    );
  },
  {
    name: "delete_brief_requirement",
    description: "删除 brief 中的一条需求。",
    schema: z.object({
      requirement_id: z.string(),
    }),
  },
);

export const clearBrief = tool(
  async (_input, config) => {
    if (parseMode(getState()) !== "inspiration") {
      return toolCommand(config, "clear_brief 仅在灵感模式可用。");
    }

    return toolCommand(config, "已清空 brief。", {
      brief: { requirements: [], ready: false },
    });
  },
  {
    name: "clear_brief",
    description: "清空全部 brief 需求并重置定稿状态。",
    schema: z.object({}),
  },
);

export const confirmBriefReady = tool(
  async (_input, config) => {
    if (parseMode(getState()) !== "inspiration") {
      return toolCommand(config, "confirm_brief_ready 仅在灵感模式可用。");
    }

    const brief = parseBrief(getState());
    if (!brief.requirements.length) {
      return toolCommand(config, "brief 尚无需求，请先确认至少一条。");
    }

    return toolCommand(config, "brief 已定稿，可进入创作模式。", {
      brief: { ...brief, ready: true },
    });
  },
  {
    name: "confirm_brief_ready",
    description: "客户确认 brief 已定稿时调用；定稿后才建议切换创作模式。",
    schema: z.object({}),
  },
);
