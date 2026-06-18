import {
  assetFromUrl,
  newWorkReference,
  pendingReferenceIntent,
  type MediaKind,
} from "@yougan/domain";

import {
  getReferences,
  patchPendingReferences,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { upsertAssetReference } from "../../run-preprocess-tools/tools/helpers/upsert-asset-reference.js";
import type { UnprocessedReferenceJob } from "./list-unprocessed-jobs.js";

const UNSUPPORTED_MEDIA_KINDS = new Set<MediaKind>(["audio", "video"]);

const UNSUPPORTED_SUMMARY: Record<"audio" | "video", string> = {
  audio:
    "音频参考素材已上传，暂不支持自动分析。请在对话中说明希望借鉴的语气、节奏或表达要点。",
  video:
    "视频参考素材已上传，暂不支持自动分析。请在对话中说明希望借鉴的画面、结构或节奏要点。",
};

export function isSupportedReferencePreprocessKind(
  mediaKind: MediaKind,
): boolean {
  return !UNSUPPORTED_MEDIA_KINDS.has(mediaKind);
}

/** 音视频素材跳过预处理，写入占位 analysis，避免阻塞后续流程。 */
export function skipUnsupportedReferenceJobs(
  state: AgentStateType,
  jobs: UnprocessedReferenceJob[],
): AgentStatePatch {
  const skipped = jobs.filter(
    (job): job is UnprocessedReferenceJob & { media_kind: "audio" | "video" } =>
      job.media_kind === "audio" || job.media_kind === "video",
  );
  if (!skipped.length) return {};

  let references = getReferences(state);
  const analyzedAt = new Date().toISOString();

  for (const job of skipped) {
    const asset = assetFromUrl(job.asset_url, {
      mime_type: job.mime_type,
      original_name: job.original_name,
    });
    references = upsertAssetReference(
      references,
      newWorkReference({
        asset,
        analysis: { summary: UNSUPPORTED_SUMMARY[job.media_kind] },
        intent: pendingReferenceIntent(),
        analyzed_at: analyzedAt,
      }),
    );
  }

  return patchPendingReferences(state, references);
}
