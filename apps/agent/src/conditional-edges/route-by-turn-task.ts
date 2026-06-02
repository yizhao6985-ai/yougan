import { parseActiveTurnTask, parseTurnTaskQueue } from "../lib/parse-agent-state.js";
import type { TurnTaskKind } from "../schema.js";
import type { AgentStateType } from "../state.js";

export const from = "dispatchTurnTask" as const;

export type TurnTaskRouteTarget =
  | "turnTaskReferences"
  | "turnTaskBrief"
  | "turnTaskEnsureOutline"
  | "turnTaskOutlinePatch"
  | "inspirationGraph"
  | "outlineGraph"
  | "creationGraph"
  | "askGraph";

export function routeByTurnTask(state: AgentStateType): TurnTaskRouteTarget {
  const task: TurnTaskKind | undefined =
    parseActiveTurnTask(state) ?? parseTurnTaskQueue(state)[0];

  switch (task) {
    case "references":
      return "turnTaskReferences";
    case "brief":
      return "turnTaskBrief";
    case "ensure_outline":
      return "turnTaskEnsureOutline";
    case "outline_patch":
      return "turnTaskOutlinePatch";
    case "outline":
      return "outlineGraph";
    case "creation":
      return "creationGraph";
    case "ask":
      return "askGraph";
    case "inspiration":
    default:
      return "inspirationGraph";
  }
}

export const paths: TurnTaskRouteTarget[] = [
  "turnTaskReferences",
  "turnTaskBrief",
  "turnTaskEnsureOutline",
  "turnTaskOutlinePatch",
  "inspirationGraph",
  "outlineGraph",
  "creationGraph",
  "askGraph",
];
