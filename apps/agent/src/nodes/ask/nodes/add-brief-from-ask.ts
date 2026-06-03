import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { newBriefRequirement } from "../../../schema.js";
import { parseActiveTurnKind, parseBrief } from "../../../lib/parse-agent-state.js";
import { getState } from "../../../lib/tool-state.js";
import { toolCommand } from "../../../lib/tool-command.js";

export const addBriefFromAsk = tool(
  async ({ description }, config) => {
    if (parseActiveTurnKind(getState()) !== "ask") {
      return toolCommand(config, "add_brief_from_ask 仅在提问模式可用。");
    }
    const trimmed = description.trim();
    if (!trimmed) return toolCommand(config, "描述不能为空。");

    const brief = parseBrief(getState());
    const exists = brief.requirements.some(
      (item) => item.description.trim() === trimmed,
    );
    if (exists) {
      return toolCommand(config, "该需求已存在于 brief 中。", { brief });
    }

    const requirements = [...brief.requirements, newBriefRequirement(trimmed)];
    return toolCommand(
      config,
      `已将问答结论记入 brief（共 ${requirements.length} 条）。`,
      {
        brief: { ...brief, requirements },
      },
    );
  },
  {
    name: "add_brief_from_ask",
    description: "客户明确要求将某条问答结论记入 brief 时调用。普通问答不要调用。",
    schema: z.object({
      description: z.string().describe("要记入 brief 的结论描述"),
    }),
  },
);
