import { END } from "@langchain/langgraph";

import type { AgentStateType } from "#agent/state.js";

export const from = "inspectProduction" as const;

const MAX_INSPECT_RETRIES = 2;

export type AfterInspectTarget = "llmCall" | "designLlmCall" | typeof END;

export function routeAfterInspect(state: AgentStateType): AfterInspectTarget {
  const meta = state.staging?.meta.production;
  if (!meta?.pendingInspect) {
    return END;
  }
  if ((meta.inspectRetryCount ?? 0) > MAX_INSPECT_RETRIES) {
    return END;
  }
  return meta.inspectPipeline === "design" ? "designLlmCall" : "llmCall";
}

export const paths: AfterInspectTarget[] = ["llmCall", "designLlmCall", END];
