import { TURN_QUEUE_ORDER, type TurnQueueKind } from "@yougan/domain";

import { getCompletedTurnKinds } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

const BRIEFING_KINDS: TurnQueueKind[] = [
  "reference",
  "profile",
  "production",
  "collectRevision",
  "revise",
];

export function completedBriefingKindsForPrompt(
  state: AgentStateType,
): TurnQueueKind[] {
  const completed = new Set(getCompletedTurnKinds(state));
  return TURN_QUEUE_ORDER.filter(
    (kind) => completed.has(kind) && BRIEFING_KINDS.includes(kind),
  );
}
