/** dispatchTurnQueue 之后：按队首 kind 进入对应子图 */
import type { TurnQueueKind } from "@yougan/domain";

import {
  getActiveTurnKind,
  getTurnQueue,
} from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export const from = "dispatchTurnQueue" as const;

export type AfterDispatchTurnQueueTarget =
  | "advanceTurnQueue"
  | "referenceGraph"
  | "profileGraph"
  | "enterProductionConfirm"
  | "enterReviseConfirm"
  | "collectRevisionGraph"
  | "askGraph";

function subgraphForKind(
  kind: Exclude<TurnQueueKind, "suggestions">,
): AfterDispatchTurnQueueTarget {
  switch (kind) {
    case "reference":
      return "referenceGraph";
    case "profile":
      return "profileGraph";
    case "production":
      return "enterProductionConfirm";
    case "collectRevision":
      return "collectRevisionGraph";
    case "revise":
      return "enterReviseConfirm";
    case "ask":
      return "askGraph";
  }
}

export function selectAfterDispatchTurnQueue(
  state: AgentStateType,
): AfterDispatchTurnQueueTarget {
  const queue = getTurnQueue(state);
  if (queue.length === 0) {
    return "advanceTurnQueue";
  }

  const kind: TurnQueueKind | undefined =
    getActiveTurnKind(state) ?? queue[0];
  if (kind === "suggestions") {
    return "advanceTurnQueue";
  }
  return subgraphForKind(kind ?? "profile");
}

export const paths: AfterDispatchTurnQueueTarget[] = [
  "advanceTurnQueue",
  "referenceGraph",
  "profileGraph",
  "enterProductionConfirm",
  "enterReviseConfirm",
  "collectRevisionGraph",
  "askGraph",
];
