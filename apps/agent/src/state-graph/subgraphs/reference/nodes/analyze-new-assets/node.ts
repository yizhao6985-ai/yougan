/**
 * analyze-new-assets：仅对新附件做客观分析（prepare → analyzeContent），intent 保持 pending。
 */
import { newWorkReference, pendingReferenceIntent } from "@yougan/domain";

import {
  getReferences,
  patchPendingReferences,
} from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import { analyzeReferenceContent } from "./helpers/analyze/analyze-content.js";
import { mapWithConcurrency } from "./helpers/map-with-concurrency.js";
import { prepareReferenceIngest } from "./helpers/prepare/prepare-asset.js";
import { upsertAssetReference } from "./helpers/upsert-asset-reference.js";
import { listNewReferenceAssets } from "./helpers/list-new-assets.js";

const ANALYZE_CONCURRENCY = 3;

export async function analyzeNewAssetsNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const adds = listNewReferenceAssets(state);
  if (!adds.length) return {};

  const analyzed = await mapWithConcurrency(
    adds,
    ANALYZE_CONCURRENCY,
    async (asset) => {
      const prep = await prepareReferenceIngest({ asset });
      const analysis = await analyzeReferenceContent(prep);
      return newWorkReference({
        asset,
        analysis,
        intent: pendingReferenceIntent(),
        analyzed_at: new Date().toISOString(),
      });
    },
  );

  let references = getReferences(state);
  for (const reference of analyzed) {
    references = upsertAssetReference(references, reference);
  }

  return patchPendingReferences(state, references);
}
