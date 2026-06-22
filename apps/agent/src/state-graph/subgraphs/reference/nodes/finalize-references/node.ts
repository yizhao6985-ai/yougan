/** finalize-references：写入 intent.summary（无 AIMessage） */
import type { RunnableConfig } from "@langchain/core/runnables";

import { deriveReferenceDelta } from "@yougan/domain";

import {
  getLatestHumanMessageId,
  getLatestHumanMessageText,
} from "#agent/messages/human.js";
import {
  getReferences,
  patchPendingReferences,
} from "#agent/state-io/index.js";
import {
  buildReferenceTurnDetail,
  createTurnActivityMessage,
  REFERENCE_TURN_SUBJECT,
  referenceTurnActivityId,
} from "#agent/state-io/turn-activities.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { applyReferenceIntentFinalization } from "./helpers/finalize-outcome.js";

export async function finalizeReferencesNode(
  state: AgentStateType,
  _config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const staging = getReferences(state);
  const committed = state.references ?? [];
  const delta = deriveReferenceDelta(committed, staging);
  const userMessage = getLatestHumanMessageText(state.messages).trim();

  const needsWork =
    delta.added.length > 0 ||
    delta.removed.length > 0 ||
    delta.toSummarize.length > 0 ||
    delta.toPrompt.length > 0 ||
    Boolean(userMessage);

  if (!needsWork) {
    return {};
  }

  const next = applyReferenceIntentFinalization(staging);
  const humanMessageId = getLatestHumanMessageId(state.messages);
  const activityMessage =
    humanMessageId != null
      ? createTurnActivityMessage({
          id: referenceTurnActivityId(humanMessageId),
          refId: humanMessageId,
          kind: "reference_update",
          status: "done",
          subject: REFERENCE_TURN_SUBJECT,
          detail: buildReferenceTurnDetail(delta),
        })
      : null;

  return {
    ...patchPendingReferences(state, next),
    ...(activityMessage ? { messages: [activityMessage] } : {}),
  };
}
