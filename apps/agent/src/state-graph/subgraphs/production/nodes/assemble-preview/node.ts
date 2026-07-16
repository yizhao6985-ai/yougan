/** work node：全部任务备妥后整理为最终 preview */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { NodeError } from "@langchain/langgraph";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import { createProductionChatModel } from "#agent/llm/providers/index.js";
import {
  contentFromProductionTasks,
  getDirectionSummary,
  getProfileFormat,
  previewHasContent,
  type WorkPreview,
} from "@yougan/domain";
import {
  getModelTemperature,
  getProduction,
  getProfile,
  patchPending,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { rethrowUnlessRecoverable } from "../../../../helpers/recoverable-node-error.js";
import { allTasksReady } from "../../helpers/task-plan.js";
import { resolveProductionMaxTokens } from "../../helpers/resolve-production-max-tokens.js";
import {
  buildConsolidateHumanPrompt,
  buildConsolidateSystemPrompt,
} from "./prompt.js";
import {
  ConsolidatedPreviewSchema,
  type ConsolidatedPreview,
} from "./schema.js";

function fallbackPayload(state: AgentStateType): ConsolidatedPreview {
  return {
    title: getDirectionSummary(getProfile(state)) || null,
    hashtags: [],
    hook: null,
    notes: null,
  };
}

function buildPreviewPatch(
  state: AgentStateType,
  payload: ConsolidatedPreview,
  config?: RunnableConfig,
): AgentStatePatch {
  const production = getProduction(state);
  const profile = getProfile(state);
  const content = contentFromProductionTasks(
    production.pending_tasks,
    getProfileFormat(profile),
  );
  if (!content) return {};

  const preview: WorkPreview = {
    title: payload.title ?? null,
    hook: payload.hook ?? null,
    hashtags: payload.hashtags ?? [],
    notes: payload.notes ?? null,
    content,
  };

  if (!previewHasContent(preview)) {
    return {};
  }

  return {
    ...patchPending(state, {
      preview,
      production: {
        ...production,
        pending_tasks: [],
      },
    }),
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}

export async function assemblePreviewNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const production = getProduction(state);
  if (!allTasksReady(production)) {
    return {};
  }

  const tasks = production.pending_tasks;
  const profile = getProfile(state);
  const content = contentFromProductionTasks(
    tasks,
    getProfileFormat(profile),
  );

  if (!content) {
    return {};
  }

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

  const payload = await invokeStructured(
    llm,
    ConsolidatedPreviewSchema,
    [
      new SystemMessage(buildConsolidateSystemPrompt({ profile })),
      new HumanMessage(
        buildConsolidateHumanPrompt({
          profile,
          plan: production,
          deliverables,
        }),
      ),
    ],
    { name: "assemble_preview" },
    config,
  );

  return buildPreviewPatch(state, payload, config);
}

export function assemblePreviewErrorHandler(
  state: AgentStateType,
  error: NodeError,
): AgentStatePatch {
  rethrowUnlessRecoverable(error);
  if (!allTasksReady(getProduction(state))) return {};
  return buildPreviewPatch(state, fallbackPayload(state));
}
