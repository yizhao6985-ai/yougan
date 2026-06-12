/** work node：全部任务备妥后整理为最终 preview */
import { HumanMessage } from "@langchain/core/messages";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import {
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
import { buildConsolidatePrompt } from "./prompt.js";
import {
  ConsolidatedPreviewSchema,
  type ConsolidatedPreview,
} from "./schema.js";

export async function assemblePreviewNode(
  state: AgentStateType,
): Promise<AgentStatePatch> {
  const production = getProduction(state);
  if (!allTasksReady(production)) {
    return {};
  }

  const deliverables: TaskDeliverable[] = production.pending_tasks
    .map((t) => {
      const body = t.deliverable?.body?.trim();
      if (!body) return null;
      return {
        taskId: t.id,
        body,
        title: t.deliverable?.title ?? null,
        notes: t.deliverable?.notes ?? null,
      };
    })
    .filter((d): d is TaskDeliverable => d !== null);

  const profile = getProfile(state);
  const delivery = resolveDeliveryFromProfile(profile);
  const llm = createChatModel({ temperature: getModelTemperature(state) });
  const prompt = buildConsolidatePrompt({ profile, plan: production, deliverables });

  let payload: ConsolidatedPreview;
  try {
    payload = await invokeStructured(
      llm,
      ConsolidatedPreviewSchema,
      [
        new HumanMessage(
          `你是整理编辑，将备妥片段组织为最终成稿（以编排为主，勿大改内容）。\n\n${prompt}`,
        ),
      ],
      { name: "assemble_preview" },
    );
  } catch {
    const body = deliverables.map((d) => d.body).join("\n\n---\n\n");
    payload = {
      title: delivery.topic ?? null,
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

  return patchPendingProductionFields(state, {
    ...production,
    pending_tasks: [],
    preview,
  });
}
