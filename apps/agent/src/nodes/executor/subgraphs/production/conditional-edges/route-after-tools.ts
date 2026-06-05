import type { AgentStateType } from "#agent/state.js";

export const from = "tools" as const;

export type AfterToolsTarget = "llmCall" | "designLlmCall" | "inspectProduction";

export function routeAfterTools(state: AgentStateType): AfterToolsTarget {
  const meta = state.staging?.meta.production;
  if (meta?.pendingInspect) {
    return "inspectProduction";
  }
  if (meta?.inspectPipeline === "design") {
    return "designLlmCall";
  }
  return "llmCall";
}

export const paths: AfterToolsTarget[] = [
  "llmCall",
  "designLlmCall",
  "inspectProduction",
];
