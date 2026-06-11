import { END } from "@langchain/langgraph";

import { getProductionStagingMeta } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

/** inspectDeliverable 之后：质检未通过且未超重试上限则回创作者，否则结束 */
export const from = "inspectDeliverable" as const;

const MAX_INSPECT_RETRIES = 2;

export type AfterInspectDeliverableTarget =
  | "directWriting"
  | "directDesign"
  | typeof END;

export function selectAfterInspectDeliverable(
  state: AgentStateType,
): AfterInspectDeliverableTarget {
  const meta = getProductionStagingMeta(state);
  if (!meta.pendingInspect) {
    return END;
  }
  if ((meta.inspectRetryCount ?? 0) > MAX_INSPECT_RETRIES) {
    return END;
  }
  return meta.inspectPipeline === "design" ? "directDesign" : "directWriting";
}

export const paths: AfterInspectDeliverableTarget[] = [
  "directWriting",
  "directDesign",
  END,
];
