import { previewHasContent } from "@yougan/domain";

import { getLatestHumanMessageId } from "#agent/messages/human.js";
import { getPreview } from "#agent/state-io/index.js";
import { patchRunProgress } from "#agent/state-io/run-progress.js";
import {
  REVISE_TURN_SUBJECT,
  reviseTurnActivityId,
  upsertTurnActivity,
} from "#agent/state-io/turn-activities.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

export async function enterReviseNode(
  state: AgentStateType,
): Promise<AgentStatePatch> {
  const progress = patchRunProgress("revise");
  const humanMessageId = getLatestHumanMessageId(state.messages);
  if (!humanMessageId || !previewHasContent(getPreview(state))) {
    return progress;
  }

  return {
    ...progress,
    ...upsertTurnActivity({
      id: reviseTurnActivityId(humanMessageId),
      refId: humanMessageId,
      kind: "revise_step",
      status: "running",
      subject: REVISE_TURN_SUBJECT,
    }),
  };
}
