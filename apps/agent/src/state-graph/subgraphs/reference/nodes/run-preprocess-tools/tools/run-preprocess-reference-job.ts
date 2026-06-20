import {
  assetFromUrl,
  newWorkReference,
  pendingReferenceIntent,
} from "@yougan/domain";

import {
  getReferences,
  patchPendingReferences,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { listProcessableReferenceJobs } from "../../../helpers/list-processable-jobs.js";
import { preprocessExpectedKind } from "../../../helpers/reference-preprocess-kind.js";
import { executeReferencePreprocess } from "./helpers/execute-preprocess.js";
import { upsertAssetReference } from "./helpers/upsert-asset-reference.js";

const PREPROCESS_FAILURE_SUMMARY =
  "参考素材已上传，自动预处理暂未完成。请在对话中说明希望借鉴的要点。";

/** 执行下一条待预处理参考，由图边路由进入本工具节点。 */
export async function runPreprocessReferenceJob(
  state: AgentStateType,
): Promise<AgentStatePatch> {
  const job = listProcessableReferenceJobs(state)[0];
  if (!job) return {};

  const expectedKind = preprocessExpectedKind(job.media_kind);
  if (!expectedKind) return {};

  const asset = assetFromUrl(job.asset_url, {
    mime_type: job.mime_type,
    original_name: job.original_name,
  });

  let references = getReferences(state);

  try {
    const result = await executeReferencePreprocess(
      asset,
      expectedKind,
      references,
    );
    if (result.ok) {
      return patchPendingReferences(state, result.references);
    }
  } catch {
    // fall through to failure placeholder
  }

  references = upsertAssetReference(
    references,
    newWorkReference({
      asset,
      analysis: { summary: PREPROCESS_FAILURE_SUMMARY },
      intent: pendingReferenceIntent(),
      analyzed_at: new Date().toISOString(),
    }),
  );

  return patchPendingReferences(state, references);
}
