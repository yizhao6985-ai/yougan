import { patchRunProgress } from "#agent/state-io/run-progress.js";
import {
  COLLECT_REVISION_SUBJECT,
  collectRevisionActivityId,
  upsertTurnActivity,
} from "#agent/state-io/turn-activities.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";
import { getLatestHumanMessageId } from "#agent/messages/human.js";

export async function enterCollectRevisionNode(
  state: AgentStateType,
): Promise<AgentStatePatch> {
  const progress = patchRunProgress("collect_revision");
  const humanMessageId = getLatestHumanMessageId(state.messages);
  if (!humanMessageId) return progress;

  return {
    ...progress,
    ...upsertTurnActivity({
      id: collectRevisionActivityId(humanMessageId),
      refId: humanMessageId,
      kind: "collect_revision",
      status: "running",
      subject: COLLECT_REVISION_SUBJECT,
    }),
  };
}
