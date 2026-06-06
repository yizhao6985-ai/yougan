/** tool：仅请求 generateDraft work node，内部不调 LLM */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import {
  hasProfileBeats,
  isPlanReady,
  isProfileActionable,
} from "@yougan/domain";
import {
  getActiveTurnKind,
  getProductionPlan,
  getProfile,
  getState,
  patchPendingProductionMeta,
} from "#agent/state-io/index.js";

import { commandWithUpdate } from "../command-with-update.js";

export const generateDraft = tool(
  async (_input, config) => {
    const state = getState();
    if (getActiveTurnKind(state) !== "production") {
      return commandWithUpdate(config, "generate_draft 仅在制作模式可用。");
    }

    const profile = getProfile(state);
    const plan = getProductionPlan(state);

    if (!hasProfileBeats(profile)) {
      return commandWithUpdate(config, "生成被阻止：尚无作品方案节拍。");
    }
    if (!plan.pending_tasks.length) {
      return commandWithUpdate(
        config,
        "生成被阻止：内部创作计划尚无待执行任务。",
      );
    }
    if (!isPlanReady(plan)) {
      return commandWithUpdate(config, "生成被阻止：创作计划尚未就绪。");
    }
    if (!isProfileActionable(profile)) {
      return commandWithUpdate(
        config,
        "生成被阻止：请先在作品方案中确认创作主题与内容节拍。",
      );
    }

    return commandWithUpdate(
      config,
      "已提交文案出稿任务，将由文案总监执行。",
      patchPendingProductionMeta(state, { pendingGenerateDraft: true }),
    );
  },
  {
    name: "generate_draft",
    description: "文案总监根据内部创作计划生成或更新成稿。",
    schema: z.object({}),
  },
);
