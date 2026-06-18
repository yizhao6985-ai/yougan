/** work node：全部任务备妥后整理为最终 preview */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import { createProductionChatModel } from "#agent/llm/providers/index.js";
import {
  patchRunProgress,
  withRunProgressHeartbeat,
} from "#agent/state-io/run-progress.js";
import {
  blocksFromProductionTasks,
  getDirectionSummary,
  type WorkPreview,
} from "@yougan/domain";
import {
  getModelTemperature,
  getProduction,
  getProfile,
  patchPendingProductionFields,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { allTasksReady } from "../../helpers/task-plan.js";
import { productionAssembleProgress } from "../../helpers/progress-labels.js";
import { resolveProductionMaxTokens } from "../../helpers/resolve-production-max-tokens.js";
import {
  buildConsolidateHumanPrompt,
  buildConsolidateSystemPrompt,
} from "./prompt.js";
import {
  ConsolidatedPreviewSchema,
  type ConsolidatedPreview,
} from "./schema.js";

export async function assemblePreviewNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const production = getProduction(state);
  if (!allTasksReady(production)) {
    return {};
  }

  const progress = productionAssembleProgress();
  const tasks = production.pending_tasks;
  const blocks = blocksFromProductionTasks(tasks);

  if (!blocks.length) {
    return {};
  }

  const profile = getProfile(state);
  const llm = createProductionChatModel({
    temperature: getModelTemperature(state),
    maxTokens: resolveProductionMaxTokens(profile),
  });

  const deliverables = tasks.flatMap((task) => {
    const body = task.deliverable?.body?.trim();
    if (!body && !task.deliverable?.images?.length) return [];
    return [
      {
        taskId: task.id,
        body: body ?? "",
        title: task.deliverable?.title ?? null,
        notes: task.deliverable?.notes ?? null,
      },
    ];
  });

  let payload: ConsolidatedPreview;
  try {
    payload = await withRunProgressHeartbeat(progress, config, () =>
      invokeStructured(
        llm,
        ConsolidatedPreviewSchema,
        [
          new SystemMessage(buildConsolidateSystemPrompt({ profile })),
          new HumanMessage(
            buildConsolidateHumanPrompt({ profile, plan: production, deliverables }),
          ),
        ],
        { name: "assemble_preview" },
        config,
      ),
    );
  } catch {
    payload = {
      title: getDirectionSummary(profile) || null,
      hashtags: [],
      hook: null,
      notes: null,
    };
  }

  const preview: WorkPreview = {
    title: payload.title ?? null,
    hook: payload.hook ?? null,
    hashtags: payload.hashtags ?? [],
    notes: payload.notes ?? null,
    blocks,
  };

  return {
    ...patchPendingProductionFields(state, {
      ...production,
      pending_tasks: [],
      preview,
    }),
    ...patchRunProgress(progress),
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}
