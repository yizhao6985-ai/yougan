/** ask 子图工具：仅 add_profile_constraint_from_ask */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { appendProfileConstraint } from "@yougan/domain";

import {
  getActiveTurnKind,
  getProfile,
  getState,
  patchPendingProfile,
} from "#agent/state-io/index.js";

import { commandWithUpdate } from "../command-with-update.js";

const addProfileConstraintFromAsk = tool(
  async ({ description }, config) => {
    if (getActiveTurnKind(getState()) !== "ask") {
      return commandWithUpdate(
        config,
        "add_profile_constraint_from_ask 仅在提问模式可用。",
      );
    }
    const trimmed = description.trim();
    if (!trimmed) return commandWithUpdate(config, "描述不能为空。");

    const state = getState();
    const profile = getProfile(state);
    const next = appendProfileConstraint(profile, trimmed);
    if (!next) {
      return commandWithUpdate(config, "该要求已存在于作品方案中。", {
        ...patchPendingProfile(state, profile),
      });
    }

    return commandWithUpdate(
      config,
      `已将问答结论记入作品方案（共 ${next.constraints.length} 条要求）。`,
      patchPendingProfile(state, next),
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
