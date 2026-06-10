/** reference 子图入口：有 pending 新附件则 ingest，否则直达 referenceTurn */
import type { AgentStateType } from "#agent/state.js";

import { listPendingAnalyzeRequests } from "../nodes/ingest-references/helpers/pending-requests.js";

export function selectReferenceEntry(
  state: AgentStateType,
): "ingestReferences" | "referenceTurn" {
  return listPendingAnalyzeRequests(state).length > 0
    ? "ingestReferences"
    : "referenceTurn";
}

export const paths = {
  ingestReferences: "ingestReferences",
  referenceTurn: "referenceTurn",
} as const;
