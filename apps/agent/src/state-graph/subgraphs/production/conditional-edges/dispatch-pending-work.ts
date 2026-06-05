/** tool-node：按 staging 待办进入 work 节点或回创作者 */
import type { AgentStateType } from "#agent/state.js";

export const from = "tool-node" as const;

export type PendingProductionWorkTarget =
  | "llm-call"
  | "design-llm-call"
  | "generateDraft"
  | "spawnSpecialist"
  | "inspectProduction";

export function dispatchPendingProductionWork(
  state: AgentStateType,
): PendingProductionWorkTarget {
  const meta = state.staging?.meta.production;
  if (meta?.pendingInspect) {
    return "inspectProduction";
  }
  if (meta?.pendingGenerateDraft) {
    return "generateDraft";
  }
  if (meta?.pendingSpawnSpecialist) {
    return "spawnSpecialist";
  }
  if (meta?.inspectPipeline === "design") {
    return "design-llm-call";
  }
  return "llm-call";
}

export const paths: PendingProductionWorkTarget[] = [
  "llm-call",
  "design-llm-call",
  "generateDraft",
  "spawnSpecialist",
  "inspectProduction",
];
