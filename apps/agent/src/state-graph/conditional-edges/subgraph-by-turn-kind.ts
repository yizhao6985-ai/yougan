/** dispatchTurnQueue：按队首 kind 进入 reference / profile / production / ask 子图 */
import type { TurnQueueKind } from "@yougan/domain";

import {
  getActiveTurnKind,
  getTurnQueue,
} from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export const from = "dispatchTurnQueue" as const;

export type SubgraphByTurnKindTarget =
  | "referenceGraph"
  | "profileGraph"
  | "productionGraph"
  | "askGraph";

function subgraphForKind(kind: TurnQueueKind): SubgraphByTurnKindTarget {
  switch (kind) {
    case "reference":
      return "referenceGraph";
    case "profile":
      return "profileGraph";
    case "production":
      return "productionGraph";
    case "ask":
      return "askGraph";
  }
}

export function selectSubgraphByTurnKind(
  state: AgentStateType,
): SubgraphByTurnKindTarget {
  const kind: TurnQueueKind | undefined =
    getActiveTurnKind(state) ?? getTurnQueue(state)[0];
  return subgraphForKind(kind ?? "profile");
}

export const paths: SubgraphByTurnKindTarget[] = [
  "referenceGraph",
  "profileGraph",
  "productionGraph",
  "askGraph",
];
