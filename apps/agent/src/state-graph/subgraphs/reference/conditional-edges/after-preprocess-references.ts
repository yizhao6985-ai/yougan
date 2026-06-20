/** preprocessReferences 之后：有待处理项则走工具节点，否则进入 mutate */
import type { AgentStateType } from "#agent/state.js";

import { listProcessableReferenceJobs } from "../helpers/list-processable-jobs.js";

export const from = "preprocessReferences" as const;

export type AfterPreprocessReferencesTarget =
  | "runPreprocessTools"
  | "mutateReferences";

export function selectAfterPreprocessReferences(
  state: AgentStateType,
): AfterPreprocessReferencesTarget {
  return listProcessableReferenceJobs(state).length > 0
    ? "runPreprocessTools"
    : "mutateReferences";
}

export const paths = {
  runPreprocessTools: "runPreprocessTools",
  mutateReferences: "mutateReferences",
} as const;
