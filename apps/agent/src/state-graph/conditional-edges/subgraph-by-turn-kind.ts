/** dispatchTurnQueue：按队首 kind 进入 profile / production / ask 子图 */
import type { TurnQueueKind } from "@yougan/domain";

import {
  parseActiveTurnKind,
  parseTurnQueue,
} from "#agent/runtime/state-readers.js";
import type { AgentStateType } from "#agent/state.js";

export const from = "dispatchTurnQueue" as const;

export type SubgraphByTurnKindTarget =
  | "profileGraph"
  | "productionGraph"
  | "askGraph";

function subgraphForKind(kind: TurnQueueKind): SubgraphByTurnKindTarget {
  switch (kind) {
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
    parseActiveTurnKind(state) ?? parseTurnQueue(state)[0];
  return subgraphForKind(kind ?? "profile");
}

export const paths: SubgraphByTurnKindTarget[] = [
  "profileGraph",
  "productionGraph",
  "askGraph",
];
