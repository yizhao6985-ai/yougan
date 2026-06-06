import { END } from "@langchain/langgraph";

import { getProductionStagingMeta } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

/** inspectProduction：质检未通过且未超重试上限则回创作者，否则结束 */
export const from = "inspectProduction" as const;

const MAX_INSPECT_RETRIES = 2;

export type DeliverableRetryTarget =
  | "llm-call"
  | "design-llm-call"
  | typeof END;

export function retryDeliverableOrEnd(
  state: AgentStateType,
): DeliverableRetryTarget {
  const meta = getProductionStagingMeta(state);
  if (!meta.pendingInspect) {
    return END;
  }
  if ((meta.inspectRetryCount ?? 0) > MAX_INSPECT_RETRIES) {
    return END;
  }
  return meta.inspectPipeline === "design" ? "design-llm-call" : "llm-call";
}

export const paths: DeliverableRetryTarget[] = [
  "llm-call",
  "design-llm-call",
  END,
];
