import {
  resolveDeliveryFromProfile,
  routeProductionPipeline,
} from "@yougan/domain";

import { getProfile } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

/** scheduleProduction：按 media_modality 选文案或设计管线 */
export const from = "scheduleProduction" as const;

export type CreatorPipelineTarget = "llm-call" | "design-llm-call";

export function selectCreatorPipelineByModality(
  state: AgentStateType,
): CreatorPipelineTarget {
  const delivery = resolveDeliveryFromProfile(getProfile(state));
  const pipeline = routeProductionPipeline(
    delivery.modalities,
    delivery.format,
  );
  return pipeline === "design" ? "design-llm-call" : "llm-call";
}

export const paths = {
  "llm-call": "llm-call",
  "design-llm-call": "design-llm-call",
} as const;
