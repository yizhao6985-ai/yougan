import {
  resolveDeliveryFromProfile,
  routeProductionPipeline,
} from "@yougan/domain";

import { getProfile } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

/** schedulePlan 之后：按 delivery 选文案或设计管线 */
export const from = "schedulePlan" as const;

export type AfterSchedulePlanTarget = "directWriting" | "directDesign";

export function selectAfterSchedulePlan(
  state: AgentStateType,
): AfterSchedulePlanTarget {
  const delivery = resolveDeliveryFromProfile(getProfile(state));
  const pipeline = routeProductionPipeline(
    delivery.modalities,
    delivery.format,
  );
  return pipeline === "design" ? "directDesign" : "directWriting";
}

export const paths = {
  directWriting: "directWriting",
  directDesign: "directDesign",
} as const;
