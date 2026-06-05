import { resolveContentSpecFromProfile } from "@yougan/domain";

import { routeProductionPipeline } from "#agent/lib/content-spec.js";
import { parseProfile } from "#agent/lib/parse-agent-state.js";
import type { AgentStateType } from "#agent/state.js";

/** scheduleProduction 之后：按 media_modality 路由到 llmCall / designLlmCall */
export const from = "scheduleProduction" as const;

export type ModalityRouteTarget = "llmCall" | "designLlmCall";

export function routeByModality(state: AgentStateType): ModalityRouteTarget {
  const resolved = resolveContentSpecFromProfile(parseProfile(state));
  const pipeline = routeProductionPipeline(
    resolved.media_modalities,
    resolved.content_format,
  );
  return pipeline === "design" ? "designLlmCall" : "llmCall";
}

export const paths = {
  llmCall: "llmCall",
  designLlmCall: "designLlmCall",
} as const;
