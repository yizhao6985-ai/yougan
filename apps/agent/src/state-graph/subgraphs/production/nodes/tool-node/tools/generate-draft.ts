/** tool：仅请求 generateDraft work node，内部不调 LLM */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import {
  hasProfileBeats,
  isPlanReady,
  isProfileActionable,
} from "@yougan/domain";
import { patchStagingProductionMeta } from "#agent/runtime/staging-writes.js";
import {
  parseActiveTurnKind,
  parseProductionPlan,
  parseProfile,
} from "#agent/runtime/state-readers.js";
import { getState, toolCommand } from "#agent/runtime/tool-context.js";

export const generateDraft = tool(
  async (_input, config) => {
    const state = getState();
    if (parseActiveTurnKind(state) !== "production") {
      return toolCommand(config, "generate_draft 仅在制作模式可用。");
    }

    const profile = parseProfile(state);
    const plan = parseProductionPlan(state);

    if (!hasProfileBeats(profile)) {
      return toolCommand(config, "生成被阻止：尚无作品方案节拍。");
    }
    if (!plan.pending_tasks.length) {
      return toolCommand(
        config,
        "生成被阻止：内部创作计划尚无待执行任务。",
      );
    }
    if (!isPlanReady(plan)) {
      return toolCommand(config, "生成被阻止：创作计划尚未就绪。");
    }
    if (!isProfileActionable(profile)) {
      return toolCommand(
        config,
        "生成被阻止：请先在作品方案中确认创作主题与内容节拍。",
      );
    }

    return toolCommand(
      config,
      "已提交文案出稿任务，将由文案总监执行。",
      patchStagingProductionMeta(state, { pendingGenerateDraft: true }),
    );
  },
  {
    name: "generate_draft",
    description: "文案总监根据内部创作计划生成或更新成稿。",
    schema: z.object({}),
  },
);
