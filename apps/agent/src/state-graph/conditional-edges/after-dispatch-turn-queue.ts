/** dispatchTurnQueue 之后：按队首 kind 进入对应子图 */
import type { TurnQueueKind } from "@yougan/domain";

import {
  getActiveTurnKind,
  getTurnQueue,
} from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export const from = "dispatchTurnQueue" as const;

export type AfterDispatchTurnQueueTarget =
  | "referenceGraph"
  | "profileGraph"
  | "confirmProductionTurn"
  | "askGraph"
  | "suggestionsGraph";

function subgraphForKind(kind: TurnQueueKind): AfterDispatchTurnQueueTarget {
  switch (kind) {
    case "reference":
      return "referenceGraph";
    case "profile":
      return "profileGraph";
    case "production":
      return "confirmProductionTurn";
    case "ask":
      return "askGraph";
    case "suggestions":
      return "suggestionsGraph";
  }
}

export function selectAfterDispatchTurnQueue(
  state: AgentStateType,
): AfterDispatchTurnQueueTarget {
  const kind: TurnQueueKind | undefined =
    getActiveTurnKind(state) ?? getTurnQueue(state)[0];
  return subgraphForKind(kind ?? "profile");
}

export const paths: AfterDispatchTurnQueueTarget[] = [
  "referenceGraph",
  "profileGraph",
  "confirmProductionTurn",
  "askGraph",
  "suggestionsGraph",
];
