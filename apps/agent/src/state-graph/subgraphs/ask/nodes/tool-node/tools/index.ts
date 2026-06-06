/** ask 子图工具：仅 add_profile_constraint_from_ask */
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { z } from "zod";

import { appendProfileConstraint } from "@yougan/domain";

import {
  getActiveTurnKind,
  getProfile,
  getState,
  patchPendingProfile,
} from "#agent/state-io/index.js";

const addProfileConstraintFromAsk = tool(
  async ({ description }, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";

    if (getActiveTurnKind(getState()) !== "ask") {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "add_profile_constraint_from_ask 仅在提问模式可用。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }
    const trimmed = description.trim();
    if (!trimmed) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "描述不能为空。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    const state = getState();
    const profile = getProfile(state);
    const next = appendProfileConstraint(profile, trimmed);
    if (!next) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "该要求已存在于作品方案中。",
              tool_call_id: toolCallId,
            }),
          ],
          ...patchPendingProfile(state, profile),
        },
      });
    }

    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: `已将问答结论记入作品方案（共 ${next.constraints.length} 条要求）。`,
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProfile(state, next),
      },
    });
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
