/**
 * ingest-references：新附件入库流水线（prepare → analyzeContent → summarizeIntent）。
 */
import { newWorkReference } from "@yougan/domain";
import { upsertAssetReference } from "./helpers/upsert-asset-reference.js";

import {
  getReferences,
  patchPendingReferences,
} from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";
import {
  summarizeReferenceIntent,
  toReferenceIntent,
} from "./helpers/summarize-intent.js";

import { analyzeReferenceContent } from "./helpers/analyze/analyze-content.js";
import { prepareReferenceIngest } from "./helpers/prepare/prepare-asset.js";
import { mapWithConcurrency } from "./helpers/map-with-concurrency.js";
import { listPendingAnalyzeRequests } from "./helpers/pending-requests.js";

const INGEST_CONCURRENCY = 3;

export async function ingestReferencesNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const requests = listPendingAnalyzeRequests(state);
  if (!requests.length) return {};

  const ingested = await mapWithConcurrency(
    requests,
    INGEST_CONCURRENCY,
    async (request) => {
      const prep = await prepareReferenceIngest(request);
      const analysis = await analyzeReferenceContent(prep);
      const intentResult = await summarizeReferenceIntent({
        analysis,
        user_context: request.user_context,
      });
      const analyzedAt = new Date().toISOString();
      return newWorkReference({
        asset: request.asset,
        analysis,
        intent: toReferenceIntent(intentResult),
        analyzed_at: analyzedAt,
      });
    },
  );

  let references = getReferences(state);
  for (const reference of ingested) {
    references = upsertAssetReference(references, reference);
  }

  return patchPendingReferences(state, references);
}
