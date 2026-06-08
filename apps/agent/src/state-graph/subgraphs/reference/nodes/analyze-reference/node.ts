/**
 * 参考素材分析节点：并行分析待处理附件并写入 staging.references。
 */
import { createChatModel } from "#agent/llm/providers/index.js";
import {
  getReferences,
  patchPendingReferences,
} from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";
import { newWorkReference, upsertAssetReference } from "@yougan/domain";

import { analyzeReferenceAsset } from "./helpers/analyze-asset.js";
import { listPendingAnalyzeRequests } from "./helpers/pending-requests.js";

export async function analyzeReferenceNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const requests = listPendingAnalyzeRequests(state);
  if (!requests.length) return {};

  const llm = createChatModel({ temperature: 0.2 });
  const analyzed = await Promise.all(
    requests.map(async (request) => {
      const parsed = await analyzeReferenceAsset(request, llm);
      const analyzedAt = new Date().toISOString();
      return newWorkReference({
        asset: request.asset,
        analysis: parsed.analysis,
        intent: parsed.intent,
        analyzed_at: analyzedAt,
      });
    }),
  );

  let references = getReferences(state);
  for (const reference of analyzed) {
    references = upsertAssetReference(references, reference);
  }

  return patchPendingReferences(state, references);
}
