import { tool } from "@langchain/core/tools";
import { z } from "zod";

import {
  appendBriefRequirement,
  clearBrief as clearBriefState,
  deleteBriefRequirement as removeBriefRequirement,
  findBriefRequirementIndex,
  updateBriefRequirement as patchBriefRequirement,
} from "@yougan/domain";
import { parseActiveTurnKind, parseBrief } from "#agent/lib/parse-agent-state.js"
import { getState } from "#agent/lib/tool-state.js"
import { toolCommand } from "#agent/lib/tool-command.js"

export const addBriefRequirement = tool(
  async ({ description }, config) => {
    if (parseActiveTurnKind(getState()) !== "inspiration") {
      return toolCommand(config, "add_brief_requirement 仅在灵感模式可用。");
    }
    const trimmed = description.trim();
    if (!trimmed) return toolCommand(config, "需求描述不能为空。");

    const brief = parseBrief(getState());
    const nextBrief = appendBriefRequirement(brief, trimmed);
    if (!nextBrief) {
      return toolCommand(config, "该需求已在 brief 中。");
    }

    return toolCommand(
      config,
      `已确认 brief 需求（共 ${nextBrief.requirements.length} 条）。`,
      { brief: nextBrief },
    );
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
    if (parseActiveTurnKind(getState()) !== "inspiration") {
      return toolCommand(config, "update_brief_requirement 仅在灵感模式可用。");
    }
    const trimmed = description.trim();
    if (!trimmed) return toolCommand(config, "需求描述不能为空。");

    const brief = parseBrief(getState());
    if (findBriefRequirementIndex(brief, requirement_id) < 0) {
      return toolCommand(config, `未找到需求 ${requirement_id}。`);
    }

    return toolCommand(config, "已更新 brief 需求。", {
      brief: patchBriefRequirement(brief, requirement_id, trimmed),
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
    if (parseActiveTurnKind(getState()) !== "inspiration") {
      return toolCommand(config, "delete_brief_requirement 仅在灵感模式可用。");
    }

    const brief = parseBrief(getState());
    if (findBriefRequirementIndex(brief, requirement_id) < 0) {
      return toolCommand(config, `未找到需求 ${requirement_id}。`);
    }

    return toolCommand(config, "已删除 brief 需求。", {
      brief: removeBriefRequirement(brief, requirement_id),
    });
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
    if (parseActiveTurnKind(getState()) !== "inspiration") {
      return toolCommand(config, "clear_brief 仅在灵感模式可用。");
    }

    return toolCommand(config, "已清空 brief。", {
      brief: clearBriefState(parseBrief(getState())),
    });
  },
  {
    name: "clear_brief",
    description: "清空全部 brief 需求。",
    schema: z.object({}),
  },
);
