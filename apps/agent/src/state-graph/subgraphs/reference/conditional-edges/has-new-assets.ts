/** reference 子图入口：有新附件需 analyze 则先 analyze，否则直达 mutate */
import type { AgentStateType } from "#agent/state.js";

import { listNewReferenceAssets } from "../nodes/analyze-new-assets/helpers/list-new-assets.js";

export function selectNext(
  state: AgentStateType,
): "analyzeNewAssets" | "mutateReferences" {
  return listNewReferenceAssets(state).length > 0
    ? "analyzeNewAssets"
    : "mutateReferences";
}

export const paths = {
  analyzeNewAssets: "analyzeNewAssets",
  mutateReferences: "mutateReferences",
} as const;
