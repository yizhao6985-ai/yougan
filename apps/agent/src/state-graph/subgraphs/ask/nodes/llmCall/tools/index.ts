/** ask 子图工具：仅 add_profile_constraint_from_ask */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { appendProfileConstraint } from "@yougan/domain";

import { parseActiveTurnKind, parseProfile } from "#agent/runtime/state-readers.js";
import { patchStagingProfile } from "#agent/runtime/staging-writes.js";
import { getState } from "#agent/runtime/tool-context.js";
import { toolCommand } from "#agent/runtime/tool-context.js";

const addProfileConstraintFromAsk = tool(
  async ({ description }, config) => {
    if (parseActiveTurnKind(getState()) !== "ask") {
      return toolCommand(
        config,
        "add_profile_constraint_from_ask 仅在提问模式可用。",
      );
    }
    const trimmed = description.trim();
    if (!trimmed) return toolCommand(config, "描述不能为空。");

    const state = getState();
    const profile = parseProfile(state);
    const next = appendProfileConstraint(profile, trimmed);
    if (!next) {
      return toolCommand(config, "该要求已存在于作品方案中。", {
        ...patchStagingProfile(state, profile),
      });
    }

    return toolCommand(
      config,
      `已将问答结论记入作品方案（共 ${next.constraints.length} 条要求）。`,
      patchStagingProfile(state, next),
    );
  },
  {
    name: "add_profile_constraint_from_ask",
    description:
      "客户明确要求将某条问答结论记入作品方案时调用。普通问答不要调用。",
    schema: z.object({
      description: z.string().describe("要记入方案的要求描述"),
    }),
  },
);

export const ASK_TOOLS = [addProfileConstraintFromAsk];
