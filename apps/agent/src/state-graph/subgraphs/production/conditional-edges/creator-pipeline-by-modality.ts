import {
  resolveDeliveryFromProfile,
  routeProductionPipeline,
} from "@yougan/domain";

import { getProfile } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

/** scheduleProduction：按 media_modality 选文案或设计管线 */
export const from = "scheduleProduction" as const;

export type CreatorPipelineTarget = "llmCall" | "designLlmCall";

export function selectCreatorPipelineByModality(
  state: AgentStateType,
): CreatorPipelineTarget {
  const delivery = resolveDeliveryFromProfile(getProfile(state));
  const pipeline = routeProductionPipeline(
    delivery.modalities,
    delivery.format,
  );
  return pipeline === "design" ? "designLlmCall" : "llmCall";
}

export const paths = {
  llmCall: "llmCall",
  designLlmCall: "designLlmCall",
} as const;
