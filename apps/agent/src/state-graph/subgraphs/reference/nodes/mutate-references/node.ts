/**
 * mutate-references：从用户消息解析 patch 并确定性写入 staging.references。
 */
import type { RunnableConfig } from "@langchain/core/runnables";

import {
  getLatestHumanMessageAttachments,
  getLatestHumanMessageText,
} from "#agent/messages/human.js";
import {
  getReferences,
  patchPendingReferences,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { applyReferencePatchPlan } from "./helpers/apply-patch-plan.js";
import { extractReferencePatch } from "./helpers/extract-patch.js";

export async function mutateReferencesNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const references = getReferences(state);
  const userMessage = getLatestHumanMessageText(state.messages).trim();
  const attachmentUrls = new Set(
    getLatestHumanMessageAttachments(state.messages)
      .map((a) => a.url.trim())
      .filter(Boolean),
  );

  if (!userMessage) {
    return {};
  }

  const patch = await extractReferencePatch(
    { references, user_message: userMessage },
    config,
  );

  const hasMutation =
    patch.deletes.length > 0 ||
    patch.intent_updates.length > 0 ||
    Boolean(patch.global_user_context?.trim());

  if (!hasMutation) {
    return {};
  }

  const { references: next, warnings } = applyReferencePatchPlan(
    references,
    patch,
    attachmentUrls,
  );

  if (warnings.length) {
    console.warn("[mutateReferences]", warnings.join("；"));
  }

  return patchPendingReferences(state, next);
}
