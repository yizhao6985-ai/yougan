import {
  assetFromUrl,
  newWorkReference,
  pendingReferenceIntent,
  type WorkReference,
} from "@yougan/domain";

import type { UnprocessedReferenceJob } from "../nodes/preprocess-references/helpers/list-unprocessed-jobs.js";
import { upsertAssetReference } from "../nodes/run-preprocess-tools/tools/helpers/upsert-asset-reference.js";
import { preprocessExpectedKind } from "./reference-preprocess-kind.js";

const UNSUPPORTED_SUMMARY = {
  video:
    "视频参考素材已上传，暂不支持自动分析。请在对话中说明希望借鉴的画面、结构或节奏要点。",
} as const;

/** 暂不自动预处理的素材写入占位 analysis，避免阻塞后续流程。 */
export function applyUnsupportedReferenceSkips(
  references: WorkReference[],
  jobs: UnprocessedReferenceJob[],
): WorkReference[] {
  const skipped = jobs.filter(
    (job): job is UnprocessedReferenceJob & { media_kind: keyof typeof UNSUPPORTED_SUMMARY } =>
      preprocessExpectedKind(job.media_kind) === null &&
      job.media_kind in UNSUPPORTED_SUMMARY,
  );
  if (!skipped.length) return references;

  const analyzedAt = new Date().toISOString();
  let next = references;

  for (const job of skipped) {
    const asset = assetFromUrl(job.asset_url, {
      mime_type: job.mime_type,
      original_name: job.original_name,
    });
    next = upsertAssetReference(
      next,
      newWorkReference({
        asset,
        analysis: { summary: UNSUPPORTED_SUMMARY[job.media_kind] },
        intent: pendingReferenceIntent(),
        analyzed_at: analyzedAt,
      }),
    );
  }

  return next;
}
