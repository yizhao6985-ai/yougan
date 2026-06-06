/** work node：文案总监 structured output 写入 preview */
import { HumanMessage } from "@langchain/core/messages";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import {
  hasProfileBeats,
  isPlanReady,
  isProfileActionable,
  resolveContentSpecFromProfile,
  type WorkPreview,
} from "@yougan/domain";
import {
  patchPendingBatch,
  patchPendingPreview,
  patchPendingProductionMeta,
} from "#agent/state-io/index.js";
import {
  getModelTemperature,
  getProductionPlan,
  getProfile,
} from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import { markDepartmentTaskPendingInspect } from "../inspect-production/helpers/set-pending-inspect.js";
import { buildGenerateDraftPrompt } from "./prompt.js";
import { WorkPreviewPayloadSchema, type WorkPreviewPayload } from "./schema.js";

export async function generateDraftNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const profile = getProfile(state);
  const plan = getProductionPlan(state);
  const contentProfile = resolveContentSpecFromProfile(profile);

  if (
    !hasProfileBeats(profile) ||
    !plan.pending_tasks.length ||
    !isPlanReady(plan) ||
    !isProfileActionable(profile)
  ) {
    return patchPendingProductionMeta(state, {
      pendingGenerateDraft: false,
    });
  }

  const llm = createChatModel({
    temperature: getModelTemperature(state),
  });
  const prompt = buildGenerateDraftPrompt({ profile, plan });

  let payload: WorkPreviewPayload;
  try {
    const input = [
      new HumanMessage(
        `你是资深文案总监，根据创作计划生成发布文案。\n\n${prompt}`,
      ),
    ];
    payload = await invokeStructured(
      llm,
      WorkPreviewPayloadSchema,
      input,
      { name: "work_preview" },
    );
  } catch {
    payload = {
      title: contentProfile.content_topic,
      body: "文案生成失败，请重试。",
      hashtags: [],
    };
  }

  const preview: WorkPreview = {
    platform: contentProfile.platform ?? "yougan",
    title: payload.title ?? null,
    body: payload.body,
    hashtags: payload.hashtags ?? [],
    hook: payload.hook ?? null,
    notes: payload.notes ?? null,
    publish_ready: true,
  };

  const inspectPatch =
    markDepartmentTaskPendingInspect(
      state,
      plan.pending_tasks,
      "writing",
      "writing",
    ) ?? {};

  return patchPendingBatch(
    patchPendingPreview(state, preview),
    inspectPatch,
    patchPendingProductionMeta(state, { pendingGenerateDraft: false }),
  );
}
