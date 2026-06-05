import type { TurnQueueKind } from "@yougan/domain";

import {
  parseActiveTurnKind,
  parseTurnQueue,
} from "#agent/lib/parse-agent-state.js";
import type { AgentStateType } from "#agent/state.js";

export const from = "dispatchTurnQueue" as const;

export type TurnQueueRouteTarget =
  | "profileGraph"
  | "productionGraph"
  | "askGraph";

function routeTargetForKind(kind: TurnQueueKind): TurnQueueRouteTarget {
  switch (kind) {
    case "profile":
      return "profileGraph";
    case "production":
      return "productionGraph";
    case "ask":
      return "askGraph";
  }
}

export function routeByTurnQueue(state: AgentStateType): TurnQueueRouteTarget {
  const kind: TurnQueueKind | undefined =
    parseActiveTurnKind(state) ?? parseTurnQueue(state)[0];
  return routeTargetForKind(kind ?? "profile");
}

export const paths: TurnQueueRouteTarget[] = [
  "profileGraph",
  "productionGraph",
  "askGraph",
];
