import {
  resolveContentSpecFromProfile,
  routeProductionPipeline,
} from "@yougan/domain";

import { parseProfile } from "#agent/runtime/state-readers.js";
import type { AgentStateType } from "#agent/state.js";

/** scheduleProduction：按 media_modality 选文案或设计管线 */
export const from = "scheduleProduction" as const;

export type CreatorPipelineTarget = "llmCall" | "designLlmCall";

export function selectCreatorPipelineByModality(
  state: AgentStateType,
): CreatorPipelineTarget {
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
