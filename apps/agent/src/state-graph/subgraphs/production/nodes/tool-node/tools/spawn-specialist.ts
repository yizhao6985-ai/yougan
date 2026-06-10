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
      "委派部门专员执行任务。须先 add_plan_task。writing 请用 generate_draft。",
    schema: z.object({
      department: z
        .enum(["writing", "design", "audio", "video"])
        .describe(
          "部门：design=配图/封面/视觉，audio=口播/音频，video=分镜/视频，writing 勿用",
        ),
      brief: z
        .string()
        .describe("交给专员的具体任务说明，含风格、用途与交付要求"),
      specialist_name: z.string().optional().describe("专员称呼，可省略"),
    }),
  },
);
