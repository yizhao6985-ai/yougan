/** tool：仅请求 spawnSpecialist work node，内部不调 LLM */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import {
  getActiveTurnKind,
  getState,
  patchPendingProductionMeta,
} from "#agent/state-io/index.js";

import { commandWithUpdate } from "../command-with-update.js";

export const spawnSpecialist = tool(
  async ({ department, brief, specialist_name }, config) => {
    const state = getState();
    if (getActiveTurnKind(state) !== "production") {
      return commandWithUpdate(config, "spawn_specialist 仅在制作模式可用。");
    }

    return commandWithUpdate(
      config,
      `已提交 ${department} 专员任务，即将执行。`,
      patchPendingProductionMeta(state, {
        pendingSpawnSpecialist: {
          department,
          brief,
          specialist_name: specialist_name ?? null,
        },
      }),
    );
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
