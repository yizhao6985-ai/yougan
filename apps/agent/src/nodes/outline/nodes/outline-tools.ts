import { tool } from "@langchain/core/tools";
import { z } from "zod";

import {
  EMPTY_WORK_OUTLINE,
  findOutlineSectionIndex,
  newOutlineSection,
} from "@yougan/domain";
import { parseActiveTurnKind, parseOutline } from "../../../lib/parse-agent-state.js";
import { getState } from "../../../lib/tool-state.js";
import { toolCommand } from "../../../lib/tool-command.js";

function requireOutlineMode(config: object): string | null {
  if (parseActiveTurnKind(getState()) !== "outline") {
    return "大纲工具仅在大纲模式可用。";
  }
  return null;
}

export const addOutlineSection = tool(
  async ({ description }, config) => {
    const gate = requireOutlineMode(config);
    if (gate) return toolCommand(config, gate);

    const trimmed = description.trim();
    if (!trimmed) return toolCommand(config, "大纲条目描述不能为空。");

    const outline = parseOutline(getState());
    const exists = outline.sections.some(
      (item) => item.description.trim() === trimmed,
    );
    if (exists) return toolCommand(config, "该条目已在大纲中。");

    const next = [...outline.sections, newOutlineSection(trimmed)];

    return toolCommand(config, `已添加大纲条目（共 ${next.length} 条）。`, {
      outline: { ...outline, sections: next },
    });
  },
  {
    name: "add_outline_section",
    description: "将用户确认的一条内容结构写入大纲。",
    schema: z.object({
      description: z.string().describe("大纲条目描述"),
    }),
  },
);

export const updateOutlineSection = tool(
  async ({ section_id, description }, config) => {
    const gate = requireOutlineMode(config);
    if (gate) return toolCommand(config, gate);

    const trimmed = description.trim();
    if (!trimmed) return toolCommand(config, "大纲条目描述不能为空。");

    const outline = parseOutline(getState());
    const index = findOutlineSectionIndex(outline, section_id);
    if (index < 0) {
      return toolCommand(config, `未找到大纲条目 ${section_id}。`);
    }

    const nextSections = [...outline.sections];
    nextSections[index] = { ...nextSections[index]!, description: trimmed };

    return toolCommand(config, "已更新大纲条目。", {
      outline: { ...outline, sections: nextSections },
    });
  },
  {
    name: "update_outline_section",
    description: "修改大纲中已有条目的描述。",
    schema: z.object({
      section_id: z.string(),
      description: z.string(),
    }),
  },
);

export const deleteOutlineSection = tool(
  async ({ section_id }, config) => {
    const gate = requireOutlineMode(config);
    if (gate) return toolCommand(config, gate);

    const outline = parseOutline(getState());
    const index = findOutlineSectionIndex(outline, section_id);
    if (index < 0) {
      return toolCommand(config, `未找到大纲条目 ${section_id}。`);
    }

    const nextSections = outline.sections.filter(
      (item) => item.id !== section_id,
    );

    return toolCommand(
      config,
      "已删除大纲条目。",
      {
        outline: {
          ...outline,
          sections: nextSections,
        },
      },
    );
  },
  {
    name: "delete_outline_section",
    description: "删除大纲中的一条条目。",
    schema: z.object({
      section_id: z.string(),
    }),
  },
);

export const clearOutline = tool(
  async (_input, config) => {
    const gate = requireOutlineMode(config);
    if (gate) return toolCommand(config, gate);

    return toolCommand(config, "已清空大纲。", {
      outline: { ...EMPTY_WORK_OUTLINE },
    });
  },
  {
    name: "clear_outline",
    description: "清空全部大纲条目。",
    schema: z.object({}),
  },
);
