import { patchRunProgress } from "#agent/state-io/run-progress.js";
import {
  REFERENCE_TURN_SUBJECT,
  referenceTurnActivityId,
  referenceTurnNeedsWork,
  upsertTurnActivity,
} from "#agent/state-io/turn-activities.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";
import {
  getLatestHumanMessageId,
  getLatestHumanMessageText,
} from "#agent/messages/human.js";
import { getReferences } from "#agent/state-io/index.js";

export async function enterReferenceNode(
  state: AgentStateType,
): Promise<AgentStatePatch> {
  const progress = patchRunProgress("reference");
  const humanMessageId = getLatestHumanMessageId(state.messages);
  if (!humanMessageId) return progress;

  const staging = getReferences(state);
  const committed = state.references ?? [];
  const userMessage = getLatestHumanMessageText(state.messages);
  if (!referenceTurnNeedsWork(committed, staging, userMessage)) {
    return progress;
  }

  return {
    ...progress,
    ...upsertTurnActivity({
      id: referenceTurnActivityId(humanMessageId),
      refId: humanMessageId,
      kind: "reference_update",
      status: "running",
      subject: REFERENCE_TURN_SUBJECT,
    }),
  };
}
