/** directDesign 之后：有 tool_calls 则执行工具；否则按需自动 spawn */
import { AIMessage } from "@langchain/core/messages";
import { END } from "@langchain/langgraph";

import type { AgentStateType } from "#agent/state.js";

import { canAutoSpawnDesign } from "../helpers/deliverable.js";

export const from = "directDesign" as const;

export type AfterDirectDesignTarget =
  | "runProductionTools"
  | "spawnSpecialist"
  | typeof END;

function lastAiHasToolCalls(state: AgentStateType): boolean {
  const last = state.messages?.at(-1);
  return (
    AIMessage.isInstance(last) && (last.tool_calls?.length ?? 0) > 0
  );
}

export function selectAfterDirectDesign(
  state: AgentStateType,
): AfterDirectDesignTarget {
  if (lastAiHasToolCalls(state)) return "runProductionTools";
  if (canAutoSpawnDesign(state)) return "spawnSpecialist";
  return END;
}

export const paths = {
  runProductionTools: "runProductionTools",
  spawnSpecialist: "spawnSpecialist",
  __end__: END,
} as const;
