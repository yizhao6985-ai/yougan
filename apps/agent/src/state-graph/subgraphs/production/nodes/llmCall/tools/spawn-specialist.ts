/** tool：仅请求 spawnSpecialist work node，内部不调 LLM */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { patchStagingProductionMeta } from "#agent/runtime/staging-writes.js";
import { parseActiveTurnKind } from "#agent/runtime/state-readers.js";
import { getState, toolCommand } from "#agent/runtime/tool-context.js";

export const spawnSpecialist = tool(
  async ({ department, brief, specialist_name }, config) => {
    const state = getState();
    if (parseActiveTurnKind(state) !== "production") {
      return toolCommand(config, "spawn_specialist 仅在制作模式可用。");
    }

    return toolCommand(
      config,
      `已提交 ${department} 专员任务，即将执行。`,
      patchStagingProductionMeta(state, {
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
