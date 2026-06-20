import type { AgentStateType } from "#agent/state.js";

import { listUnprocessedReferenceJobs } from "../nodes/preprocess-references/helpers/list-unprocessed-jobs.js";
import { isSupportedReferencePreprocessKind } from "./reference-preprocess-kind.js";

export function listProcessableReferenceJobs(state: AgentStateType) {
  return listUnprocessedReferenceJobs(state).filter((job) =>
    isSupportedReferencePreprocessKind(job.media_kind),
  );
}
