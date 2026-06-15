/** work node：全部任务备妥后整理为最终 preview */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createProductionChatModel } from "#agent/llm/providers/index.js";
import {
  patchRunProgress,
  withRunProgressHeartbeat,
} from "#agent/state-io/run-progress.js";
import {
  getIntentSummary,
  resolveDeliveryFromProfile,
  type TaskDeliverable,
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

  const deliverables: TaskDeliverable[] = production.pending_tasks.flatMap(
    (t) => {
      const body = t.deliverable?.body?.trim();
      if (!body) return [];
      const item: TaskDeliverable = {
        taskId: t.id,
        body,
        title: t.deliverable?.title,
        notes: t.deliverable?.notes,
      };
      return [item];
    },
  );

  const profile = getProfile(state);
  const delivery = resolveDeliveryFromProfile(profile);
  const llm = createProductionChatModel({
    temperature: getModelTemperature(state),
    maxTokens: resolveProductionMaxTokens(profile),
  });
  const promptInput = { profile, plan: production, deliverables };

  let payload: ConsolidatedPreview;
  try {
    payload = await withRunProgressHeartbeat(progress, config, () =>
      invokeStructured(
        llm,
        ConsolidatedPreviewSchema,
        [
          new SystemMessage(buildConsolidateSystemPrompt({ profile })),
          new HumanMessage(buildConsolidateHumanPrompt(promptInput)),
        ],
        { name: "assemble_preview" },
        config,
      ),
    );
  } catch {
    const body = deliverables.map((d) => d.body).join("\n\n---\n\n");
    payload = {
      title: getIntentSummary(profile) || null,
      body: body || "整理失败，请重试。",
      hashtags: [],
      hook: null,
      notes: null,
    };
  }

  const preview: WorkPreview = {
    platform: delivery.platform ?? "yougan",
    title: payload.title ?? null,
    body: payload.body,
    hashtags: payload.hashtags ?? [],
    hook: payload.hook ?? null,
    notes: payload.notes ?? null,
  };

  return {
    ...patchPendingProductionFields(state, {
      ...production,
      pending_tasks: [],
      preview,
    }),
    ...patchRunProgress(progress),
  };
}
