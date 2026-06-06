/** tool：仅请求 spawnSpecialist work node，内部不调 LLM */
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { z } from "zod";

import {
  getActiveTurnKind,
  getState,
  patchPendingProductionMeta,
} from "#agent/state-io/index.js";

export const spawnSpecialist = tool(
  async ({ department, brief, specialist_name }, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const state = getState();

    if (getActiveTurnKind(state) !== "production") {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "spawn_specialist 仅在制作模式可用。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: `已提交 ${department} 专员任务，即将执行。`,
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProductionMeta(state, {
          pendingSpawnSpecialist: {
            department,
            brief,
            specialist_name: specialist_name ?? null,
          },
        }),
      },
    });
  },
  {
    name: "spawn_specialist",
    description:
      "临时创建部门专员执行任务。design=配图；audio=口播；video=分镜；writing 请用 generate_draft。",
    schema: z.object({
      department: z
        .enum(["writing", "design", "audio", "video"])
        .describe("部门"),
      brief: z.string().describe("交给专员的具体任务说明"),
      specialist_name: z
        .string()
        .optional()
        .describe("专员称呼"),
    }),
  },
);
